package io.quarkus.service.proxy;

import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.server.jaxrs.ResponseBuilderImpl;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import io.fabric8.kubernetes.client.KubernetesClient;
import io.vertx.core.Vertx;
import io.vertx.ext.web.client.HttpResponse;
import io.vertx.ext.web.client.WebClient;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import jakarta.ws.rs.core.Response.ResponseBuilder;

@Path("/produi")
public class ProduiProxyResource {

    private Logger log = Logger.getLogger(ProduiProxyResource.class);

    @Inject
    KubernetesClient kubernetesClient;

    @Inject
    Vertx vertx;

    @Context
    UriInfo uriInfo;

    @Context
    HttpHeaders headers;

    @GET
    @Path("/{namespace}/{name}/{path:.*}")
    public Response proxy(String namespace, String name, String path) {
        WebClient client = WebClient.create(vertx);
        String fullPath = path.startsWith("/") ? path : "/" + path;
        log.info("Proxying produi endpoint: http://" + name + "." + namespace + fullPath);
        return client.get(80, name + "." + namespace, fullPath).send().toCompletionStage()
                .thenApply(response -> mapResponse(response, s -> mapUrl(s, namespace, name))).toCompletableFuture()
                .join();
    }

    public <T> Response mapResponse(HttpResponse<T> response, Function<String, String> mapUrl) {
        ResponseBuilder builder = new ResponseBuilderImpl();
        builder.status(response.statusCode());
        builder.type(response.getHeader(HttpHeaders.CONTENT_TYPE));
        for (Map.Entry<String, String> entry : response.headers().entries()) {
            builder.header(entry.getKey(), entry.getValue());
        }
        // set cors headers
        builder.header("Access-Control-Allow-Origin", "*");
        builder.entity(mapRefs(response, mapUrl));
        return builder.build();
    }

    public <T> T mapRefs(HttpResponse<T> response, Function<String, String> adjustUrl) {
        if (response == null) {
            return null;
        }
        if (response.body() == null) {
            return null;
        }
        String htmlContent = response.body().toString();
        if (htmlContent == null) {
            return response.body();
        }
        Document document = Jsoup.parse(htmlContent);

        // Modify asset URLs
        Elements elements = document.select("link[href], script[src], img[src]");
        for (Element element : elements) {
            Optional<String> attrName = Optional.ofNullable(element.attributes().hasKey("src") ? "src" : null)
                    .or(() -> Optional.ofNullable(element.attributes().hasKey("href") ? "href" : null));
            attrName.ifPresent(name -> element.attr(name, adjustUrl.apply(element.attr(name))));
        }
        // Return the modified HTML content
        return (T) document.toString();
    }

    public String mapUrl(String url, String namespace, String name) {
        if (url.startsWith("http://") || url.startsWith("https://")) {
            return url;
        }
        String prefix = "/api/proxy/plugin/camel-openshift-console-plugin/service-proxy/produi/" + namespace + "/"
                + name;
        if (url.startsWith(prefix)) {
            return url;
        }
        if (!url.startsWith("/")) {
            url = "/q/dev-ui/" + url;
        }
        return prefix + url;
    }
}
