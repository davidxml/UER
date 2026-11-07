package com.unilag.uer.incident;

import java.net.URI;
import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
 * REST controller for the UER incident lifecycle.
 *
 * <pre>
 * POST   /api/v1/incidents                → create (REPORTER, 201)
 * GET    /api/v1/incidents/mine           → own reports (REPORTER)
 * GET    /api/v1/incidents?department=X   → feed (RESPONDER/ADMIN)
 * GET    /api/v1/incidents/{id}           → detail (RESPONDER/ADMIN, own unit)
 * PATCH  /api/v1/incidents/{id}/status    → advance lifecycle (RESPONDER/ADMIN)
 * PATCH  /api/v1/incidents/{id}/severity  → reassign severity (RESPONDER/ADMIN)
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
    public ResponseEntity<Incident> createIncident(
            @RequestBody IncidentRequest request,
            Authentication authentication) {
        Incident saved = service.createIncident(request, authentication.getName());
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(saved.getId())
                .toUri();
        return ResponseEntity.created(location).body(saved);
    }

    /** Reports created by the signed-in student. */
    @GetMapping("/mine")
    public List<Incident> getMyIncidents(Authentication authentication) {
        return service.getIncidentsForReporter(authentication.getName());
    }

    /**
     * Incident feed for responders. A responder is always scoped to their own
     * unit; an admin may pass {@code ?department=X} or omit it for everything.
     */
    @GetMapping
    public List<Incident> getIncidents(
            @RequestParam Optional<String> department,
            Authentication authentication) {
        if (isAdmin(authentication)) {
            return service.getIncidents(department);
        }
        return service.getIncidents(Optional.ofNullable(unit(authentication)));
    }

    /** Returns a single incident by its id. */
    @GetMapping("/{id}")
    public Incident getIncidentById(@PathVariable String id, Authentication authentication) {
        return service.getIncidentById(id, unitOrNullForAdmin(authentication));
    }

    /** Advances an incident's lifecycle status. */
    @PatchMapping("/{id}/status")
    public Incident updateStatus(
            @PathVariable String id,
            @RequestBody StatusUpdateRequest request,
            Authentication authentication) {
        return service.updateStatus(id, request.status(), unitOrNullForAdmin(authentication));
    }

    /** Reassigns an incident's severity level. */
    @PatchMapping("/{id}/severity")
    public Incident updateSeverity(
            @PathVariable String id,
            @RequestBody SeverityUpdateRequest request,
            Authentication authentication) {
        return service.updateSeverity(id, request.severity(), unitOrNullForAdmin(authentication));
    }

    private static String unitOrNullForAdmin(Authentication authentication) {
        return isAdmin(authentication) ? null : unit(authentication);
    }

    private static String unit(Authentication authentication) {
        return authentication.getDetails() instanceof String department ? department : null;
    }

    private static boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
