import { Application } from "types";

export function extractEnvironmentVariables(application: Application): Record<string, string> {
  const envVars: Record<string, string> = {};

  if (application.spec.containers && application.spec.containers.length > 0) {
    application.spec.containers.forEach((container) => {
      if (container.env) {
        container.env.forEach((envVar) => {
          if (envVar.name && envVar.value) {
            envVars[envVar.name] = envVar.value;
          }
        });
      }
    });
  }

  return envVars;
}

export function extractSecretEnvironmentVariables(application: Application): Record<string, string> {
  const secretEnvVars: Record<string, string> = {};

  // Check if the application has secret references
  if (application.spec.containers && application.spec.containers.length > 0) {
    application.spec.containers.forEach((container) => {
      if (container.envFrom) {
        container.envFrom.forEach((envSource) => {
          if (envSource.secretRef && envSource.secretRef.name) {
            // You can retrieve the secret name and handle it as needed
            const secretName = envSource.secretRef.name;
            // Add code here to fetch secret data and extract environment variables
            secretEnvVars[secretName] = '';
          }
        });
      }
    });
  }

  return secretEnvVars;
}

export function extractConfigMapEnvironmentVariables(application: Application): Record<string, string> {
  const configMapEnvVars: Record<string, string> = {};

  // Check if the application has secret references
  if (application.spec.containers && application.spec.containers.length > 0) {
    application.spec.containers.forEach((container) => {
      if (container.envFrom) {
        container.envFrom.forEach((envSource) => {
          if (envSource.configMapRef && envSource.configMapRef.name) {
            // You can retrieve the secret name and handle it as needed
            const configMapName = envSource.configMapRef.name;
            // Add code here to fetch secret data and extract environment variables
            configMapEnvVars[configMapName] = '';
          }
        });
      }
    });
  }

  return configMapEnvVars;
}

export function extractMountedSecrets(application: Application): string[] {
  const mountedSecrets: string[] = [];

  if (application.spec.volumes) {
    application.spec.volumes.forEach((volume) => {
      if (volume.secret && volume.secret.secretName) {
        mountedSecrets.push(volume.secret.secretName);
      }
    });
  }

  return mountedSecrets;
}

export function extractMountedConfigMaps(application: Application): string[] {
  const mountedConfigMaps: string[] = [];
  if (application.spec.volumes) {
    application.spec.volumes.forEach((volume) => {
      if (volume.configMap && volume.configMap.name) {
        mountedConfigMaps.push(volume.configMap.name);
      }
    });
  }

  return mountedConfigMaps;
}


export function extractProbes(application: Application) {
  const probes = {
    readinessProbe: application.spec.containers[0]?.readinessProbe || null,
    livenessProbe: application.spec.containers[0]?.livenessProbe || null,
    startupProbe: application.spec.containers[0]?.startupProbe || null,
  };

  return probes;
}
