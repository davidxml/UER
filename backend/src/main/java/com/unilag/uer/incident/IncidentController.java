package com.unilag.uer.incident;

import java.net.URI;
import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/**
 * REST controller for the UER incident lifecycle. All endpoints are open
 * (permitAll) — no auth layer is wired yet.
 *
 * <pre>
 * POST   /api/v1/incidents              → create  (201)
 * GET    /api/v1/incidents?department=X → list, optionally filtered
 * GET    /api/v1/incidents/{id}         → detail  (404 if missing)
 * PATCH  /api/v1/incidents/{id}/status  → advance lifecycle
 * PATCH  /api/v1/incidents/{id}/severity → reassign severity
 * </pre>
 */
@RestController
@RequestMapping("/api/v1/incidents")
public class IncidentController {

    private final IncidentService service;

    public IncidentController(IncidentService service) {
        this.service = service;
    }

    /** Persists a new incident. Returns 201 with the saved resource URI. */
    @PostMapping
    public ResponseEntity<Incident> createIncident(@RequestBody IncidentRequest request) {
        Incident saved = service.createIncident(request);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(saved.getId())
                .toUri();
        return ResponseEntity.created(location).body(saved);
    }

    /**
     * Lists all incidents. Pass {@code ?department=X} to narrow the results
     * to a specific emergency unit.
     */
    @GetMapping
    public List<Incident> getIncidents(
            @RequestParam Optional<String> department) {
        return service.getIncidents(department);
    }

    /** Returns a single incident by its id. */
    @GetMapping("/{id}")
    public Incident getIncidentById(@PathVariable String id) {
        return service.getIncidentById(id);
    }

    /** Advances an incident's lifecycle status. */
    @PatchMapping("/{id}/status")
    public Incident updateStatus(
            @PathVariable String id,
            @RequestBody StatusUpdateRequest request) {
        return service.updateStatus(id, request.status());
    }

    /** Reassigns an incident's severity level. */
    @PatchMapping("/{id}/severity")
    public Incident updateSeverity(
            @PathVariable String id,
            @RequestBody SeverityUpdateRequest request) {
        return service.updateSeverity(id, request.severity());
    }
}
