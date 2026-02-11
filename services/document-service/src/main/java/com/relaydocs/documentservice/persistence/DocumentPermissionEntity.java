package com.relaydocs.documentservice.persistence;

import com.relaydocs.documentservice.domain.PermissionRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "document_permissions",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_document_permissions_doc_user", columnNames = {"document_id", "user_id"})
        }
)
public class DocumentPermissionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    private DocumentEntity document;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 50)
    private PermissionRole role;

    protected DocumentPermissionEntity() {
    }

    public DocumentPermissionEntity(DocumentEntity document, UserEntity user, PermissionRole role) {
        this.document = document;
        this.user = user;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public DocumentEntity getDocument() {
        return document;
    }

    public UserEntity getUser() {
        return user;
    }

    public PermissionRole getRole() {
        return role;
    }

    public void setRole(PermissionRole role) {
        this.role = role;
    }
}