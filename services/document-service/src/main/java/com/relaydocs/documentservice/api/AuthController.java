package com.relaydocs.documentservice.api;

import com.relaydocs.documentservice.api.dto.AuthUserResponse;
import com.relaydocs.documentservice.api.dto.LoginRequest;
import com.relaydocs.documentservice.api.dto.SignupRequest;
import com.relaydocs.documentservice.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ResponseEntity<Map<String, AuthUserResponse>> signup(@RequestBody @Valid SignupRequest request) {
        String userId = authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("user", new AuthUserResponse(userId)));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, AuthUserResponse>> login(@RequestBody @Valid LoginRequest request) {
        String userId = authService.login(request);
        return ResponseEntity.ok(Map.of("user", new AuthUserResponse(userId)));
    }
}
