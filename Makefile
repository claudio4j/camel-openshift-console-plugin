# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# Use bash explicitly in this Makefile to avoid unexpected platform
# incompatibilities among Linux distros.
#

IMAGE_NAME_PLUGIN=quay.io/cmiranda/camel-openshift-console-plugin
IMAGE_NAME_SERVICE_PROXY=quay.io/cmiranda/camel-openshift-console-service-proxy

plugin:
	cd plugin && yarn build && yarn install

service-proxy:
	cd service-proxy && mvn clean install

service-proxy-image: service-proxy
	podman build -t $(IMAGE_NAME_SERVICE_PROXY):latest servcie-proxy -f service-proxy/src/main/docker/Dockerfile.jvm

plugin-image: plugin
	podman build -t $(IMAGE_NAME_PLUGIN):latest plugin

images: plugin-image service-proxy-image

push-service-proxy: service-proxy-image
	podman push $(IMAGE_NAME_SERVICE_PROXY):latest

push-plugin:
	podman push $(IMAGE_NAME_PLUGIN):latest

push: push-plugin push-service-proxy

deploy-plugin:
	./bin/camel-install-openshift-console-plugin

deploy-proxy:
	cd service-proxy && \
	mvn clean install && \
	camel deploy openshift --image-build --namespace plugin-camel-openshift-console-plugin

deploy: deploy-plugin deploy-proxy

undeploy:
	helm uninstall camel-openshift-console-plugin --namespace=plugin-camel-openshift-console-plugin

all: images push deploy
