package com.unilag.uer.incident;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Inbound POST body for a new incident. Mirrors every client-controlled field
 * on the {@link Incident} entity while deliberately omitting server-controlled
 * values ({@code status}) so the service layer sets them on create.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentRequest {

    /** Client-generated id, e.g. "INC-2026-452". */
    private String id;

    /** Client-derived report title, e.g. "Fire Incidence Report". */
    private String type;

    /** Legacy placeholder location field, stored as-sent. */
    private String location;

    /** Formatted address, e.g. "Senate Building, University of Lagos". */
    private String locationText;

    /** "HH:MM" as sent by the client. */
    private String time;

    /** Comma-joined department list, e.g. "Fire Station, Medical Center". */
    private String tagged;

    /** "high" | "medium" | "low". */
    private String severity;

    /** The reporter's original message. */
    private String text;

    /** Base64 photo data-URLs, up to 4. */
    private List<String> images;
}
