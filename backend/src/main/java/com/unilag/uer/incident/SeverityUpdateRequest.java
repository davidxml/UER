package com.unilag.uer.incident;

/**
 * PATCH body for reassigning an incident's severity. The value is validated
 * by the service layer against the three allowed levels.
 */
public record SeverityUpdateRequest(String severity) {}
