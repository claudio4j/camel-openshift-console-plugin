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

@Path("/metrics")
public class MetricsProxyResource {

    private Logger log = Logger.getLogger(MetricsProxyResource.class);
    private static final String PATH = "/q/metrics";

    @Inject
    Vertx vertx;

    @Inject
    KubernetesClient kubernetesClient;

    @GET
    @Path("/{namespace}/{name}")
    @RolesAllowed("user")
    public Response proxy(String namespace, String name) {
        WebClient client = WebClient.create(vertx);
        log.info("Proxying metrics endpint: http://" + name + "." + namespace + PATH);
        return client
                .get(80, name + "." + namespace, PATH)
                .send()
                .toCompletionStage()
                .thenApply(response -> Response.status(response.statusCode()).entity(response.bodyAsString()).build())
                .toCompletableFuture()
                .join();
    }
}
