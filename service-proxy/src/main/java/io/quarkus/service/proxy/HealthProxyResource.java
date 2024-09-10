package io.quarkus.service.proxy;

import org.jboss.logging.Logger;

import io.fabric8.kubernetes.client.KubernetesClient;
import io.vertx.core.Vertx;
import io.vertx.ext.web.client.WebClient;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;

@Path("/health")
public class HealthProxyResource {

    private Logger log = Logger.getLogger(HealthProxyResource.class);

    @Inject
    Vertx vertx;

    @Inject
    KubernetesClient kubernetesClient;

    @GET
    @Path("/{namespace}/{name}/{path:.*}")
    @RolesAllowed("user")
    public Response proxy(String namespace, String name, String path) {
        WebClient client = WebClient.create(vertx);
        String fullPath = path.startsWith("/") ? path : "/" + path;
        log.info("Proxying health endpint: http://" + name + "." + namespace + fullPath);
        return client
                .get(80, name + "." + namespace, fullPath)
                .send()
                .toCompletionStage()
                .thenApply(response -> Response.status(response.statusCode()).entity(response.bodyAsString()).build())
                .toCompletableFuture()
                .join();
    }
}
