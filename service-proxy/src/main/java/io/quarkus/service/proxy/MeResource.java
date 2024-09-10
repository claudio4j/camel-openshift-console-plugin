package io.quarkus.service.proxy;

import io.quarkus.security.identity.SecurityIdentity;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;

@Path("/me")
public class MeResource {

    @Inject
    SecurityIdentity identity;

    @GET
    public String status() {
        return identity.getPrincipal().getName();
    }
}
