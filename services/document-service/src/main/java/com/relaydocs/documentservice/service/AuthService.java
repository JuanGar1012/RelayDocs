package com.relaydocs.documentservice.service;

import com.relaydocs.documentservice.api.dto.LoginRequest;
import com.relaydocs.documentservice.api.dto.SignupRequest;
import com.relaydocs.documentservice.persistence.AuthCredentialEntity;
import com.relaydocs.documentservice.persistence.AuthCredentialRepository;
import com.relaydocs.documentservice.persistence.UserEntity;
import com.relaydocs.documentservice.persistence.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final AuthCredentialRepository authCredentialRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, AuthCredentialRepository authCredentialRepository) {
        this.userRepository = userRepository;
        this.authCredentialRepository = authCredentialRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Transactional
    public String signup(SignupRequest request) {
        String username = request.username().trim();
        String password = request.password().trim();

        if (username.isEmpty() || password.isEmpty()) {
            throw new ApiBadRequestException("Username and password are required");
        }

        if (authCredentialRepository.existsById(username)) {
            throw new ApiBadRequestException("Username already exists");
        }

        userRepository.findById(username)
                .orElseGet(() -> userRepository.save(new UserEntity(username, username + "@relaydocs.local")));

        String passwordHash = passwordEncoder.encode(password);
        authCredentialRepository.save(new AuthCredentialEntity(username, passwordHash));

        return username;
    }

    @Transactional
    public String login(LoginRequest request) {
        String username = request.username().trim();
        String password = request.password();

        AuthCredentialEntity credential = authCredentialRepository.findById(username)
                .orElseThrow(() -> new ApiUnauthorizedException("Invalid credentials"));

        if (!passwordEncoder.matches(password, credential.getPasswordHash())) {
            throw new ApiUnauthorizedException("Invalid credentials");
        }

        return username;
    }
}
