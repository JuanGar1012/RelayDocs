package com.relaydocs.documentservice.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthCredentialRepository extends JpaRepository<AuthCredentialEntity, String> {
}
