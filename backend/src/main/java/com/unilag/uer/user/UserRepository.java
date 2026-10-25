package com.unilag.uer.user;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByLoginIdIgnoreCase(String loginId);

    boolean existsByLoginIdIgnoreCase(String loginId);

    List<User> findByRoleOrderByCreatedAtDesc(Role role);

    long countByRole(Role role);
}
