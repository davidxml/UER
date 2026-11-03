package com.unilag.uer.incident;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Business logic for UER incidents. Thin layer — validates inputs and
 * delegates persistence to {@link IncidentRepository}. No department routing
 * or inference; that is the client's responsibility.
 */
@Service
public class IncidentService {

    private static final Set<String> VALID_STATUSES = Set.of("Reported", "En Route", "Resolved");
    private static final Set<String> VALID_SEVERITIES = Set.of("high", "medium", "low");

    private final IncidentRepository repository;
    private final SimpMessagingTemplate messagingTemplate;

    public IncidentService(IncidentRepository repository, SimpMessagingTemplate messagingTemplate) {
        this.repository = repository;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Persists a new incident on behalf of the authenticated reporter. The
     * reporter id is taken from the security context, never from the body.
     */
    public Incident createIncident(IncidentRequest request, String reporterId) {
        // The client generates the id so an offline report can be replayed.
        if (request.getId() == null || request.getId().isBlank()) {
            throw new IllegalArgumentException("id must not be blank");
        }
        if (request.getLocationText() == null || request.getLocationText().isBlank()) {
            throw new IllegalArgumentException("locationText must not be blank");
        }
        if (request.getText() == null || request.getText().isBlank()) {
            throw new IllegalArgumentException("text must not be blank");
        }

        Incident incident = Incident.builder()
                .id(request.getId())
                .type(request.getType())
                .location(request.getLocation())
                .locationText(request.getLocationText().trim())
                .time(request.getTime())
                .status("Reported")
                .tagged(request.getTagged())
                .severity(request.getSeverity() != null ? request.getSeverity() : "medium")
                .text(request.getText().trim())
                .images(request.getImages() != null ? request.getImages() : List.of())
                .reporterId(reporterId)
                .build();

        Incident saved = repository.save(incident);
        messagingTemplate.convertAndSend("/topic/incidents", saved);
        return saved;
    }

    /**
     * Returns every incident visible to the caller. When a department is
     * supplied, the list is narrowed to incidents routed to that unit. Results
     * are sorted newest first by the {@code time} field.
     */
    public List<Incident> getIncidents(Optional<String> department) {
        List<Incident> incidents = department
                .filter(d -> !d.isBlank())
                .map(repository::findByTaggedContaining)
                .orElseGet(repository::findAll);

        return incidents.stream()
                .sorted(Comparator.comparing(Incident::getTime).reversed())
                .toList();
    }

    /** Incidents created by one reporter. */
    public List<Incident> getIncidentsForReporter(String reporterId) {
        return repository.findByReporterId(reporterId).stream()
                .sorted(Comparator.comparing(Incident::getTime).reversed())
                .toList();
    }

    /**
     * Returns a single incident. Responders may only read incidents routed to
     * their own unit; a null {@code unit} means unrestricted (admin).
     */
    public Incident getIncidentById(String id, String unit) {
        Incident incident = getIncidentById(id);
        requireUnitAccess(incident, unit);
        return incident;
    }

    private Incident getIncidentById(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException(
                        "Incident not found: " + id));
    }

    /**
     * Advances an incident's lifecycle. Only the three defined values are
     * accepted. Responders may only change incidents tagged to their unit.
     */
    public Incident updateStatus(String id, String newStatus, String unit) {
        if (!VALID_STATUSES.contains(newStatus)) {
            throw new IllegalArgumentException(
                    "Invalid status: " + newStatus + ". Must be one of " + VALID_STATUSES);
        }

        Incident incident = getIncidentById(id);
        requireUnitAccess(incident, unit);
        incident.setStatus(newStatus);
        Incident updated = repository.save(incident);
        messagingTemplate.convertAndSend("/topic/incidents", updated);
        return updated;
    }

    /**
     * Reassigns an incident's severity. Only the three defined values are
     * accepted. Responders may only change incidents tagged to their unit.
     */
    public Incident updateSeverity(String id, String newSeverity, String unit) {
        if (!VALID_SEVERITIES.contains(newSeverity)) {
            throw new IllegalArgumentException(
                    "Invalid severity: " + newSeverity + ". Must be one of " + VALID_SEVERITIES);
        }

        Incident incident = getIncidentById(id);
        requireUnitAccess(incident, unit);
        incident.setSeverity(newSeverity);
        Incident updated = repository.save(incident);
        messagingTemplate.convertAndSend("/topic/incidents", updated);
        return updated;
    }

    private static void requireUnitAccess(Incident incident, String unit) {
        if (unit == null) {
            return;
        }
        String tagged = incident.getTagged();
        if (tagged == null || !tagged.contains(unit)) {
            throw new AccessDeniedException("This incident is not assigned to your unit");
        }
    }
}
