.PHONY: help build-web deploy-build

SERVER_USER = root
SERVER_HOST = 31.97.255.125
WEB_BUILD_DIR = dist
WEB_BUILD_SERVER_PATH = /www/wwwroot/web-build

help:
	@echo "Comandos disponiveis:"
	@echo "  make build-web     - Gera build local do Vue"
	@echo "  make deploy-build  - Gera build e envia para o servidor"

build-web:
	@echo "Gerando build do frontend..."
	npm ci
	npm run build
	@echo "Build gerado em $(WEB_BUILD_DIR)"

deploy-build: build-web
	@echo "Enviando build para $(SERVER_USER)@$(SERVER_HOST):$(WEB_BUILD_SERVER_PATH)..."
	ssh $(SERVER_USER)@$(SERVER_HOST) 'mkdir -p $(WEB_BUILD_SERVER_PATH) && rm -rf $(WEB_BUILD_SERVER_PATH)/*'
	scp -r $(WEB_BUILD_DIR)/* $(SERVER_USER)@$(SERVER_HOST):$(WEB_BUILD_SERVER_PATH)/
	@echo "Build enviado para $(WEB_BUILD_SERVER_PATH)"
