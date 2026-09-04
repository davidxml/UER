package com.unilag.uer.incident;

/**
 * PATCH body for advancing an incident's status. The value is validated
 * by the service layer against the three allowed lifecycle states.
 */
public record StatusUpdateRequest(String status) {}
