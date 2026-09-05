package com.unilag.uer.incident;

import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A reported incident, mirroring the exact JSON contract the UER frontend
 * posts. The {@code id} is client-generated (e.g. "INC-2026-452") and stored
 * as-is; there is no server-side key generation.
 */
@Entity
@Table(name = "incidents")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Incident {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    /** Client-derived report title, e.g. "Fire Incidence Report". */
    @Column(name = "type")
    private String type;

    /** Legacy placeholder location field, stored as-sent. */
    @Column(name = "location")
    private String location;

    /** Formatted address, e.g. "Senate Building, University of Lagos". */
    @Column(name = "location_text")
    private String locationText;

    /** "HH:MM" as sent by the client. */
    @Column(name = "time")
    private String time;

    /** "Reported" | "En Route" | "Resolved". */
    @Column(name = "status", nullable = false)
    private String status;

    /** Comma-joined department list, e.g. "Fire Station, Medical Center". */
    @Column(name = "tagged")
    private String tagged;

    /** "high" | "medium" | "low". */
    @Column(name = "severity")
    private String severity;

    /** The reporter's original message. */
    @Column(name = "text")
    private String text;

    /** Base64 photo data-URLs, up to 4, stored as a JSONB array. */
    @Column(name = "images", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> images;
}
