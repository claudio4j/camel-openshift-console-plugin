package io.quarkus.service.proxy;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;

@Path("/status")
public class StatusResource {

    @GET
    public String status() {
        return "OK";
    }
}
