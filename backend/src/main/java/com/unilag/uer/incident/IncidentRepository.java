package com.unilag.uer.incident;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Data access for {@link Incident}. All existing incidents are keyed by the
 * client-generated id string.
 */
public interface IncidentRepository extends JpaRepository<Incident, String> {

    /**
     * Returns incidents routed to a given department, matching the department
     * substring within the comma-joined {@code tagged} column.
     */
    List<Incident> findByTaggedContaining(String department);
}
