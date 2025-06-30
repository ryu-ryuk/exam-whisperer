APP_NAME=exam-whisperer
DOCKER_COMPOSE=docker compose

# start the containers
up:
	$(DOCKER_COMPOSE) up

# stop the containers
down:
	$(DOCKER_COMPOSE) down

# rebuild image without cache
rebuild:
	$(DOCKER_COMPOSE) build 

# view logs
logs:
	$(DOCKER_COMPOSE) logs -f $(APP_NAME)

# enter app container shell
sh:
	docker exec $(APP_NAME) /bin/bash

# restart just the app container
restart:
	$(DOCKER_COMPOSE) restart $(APP_NAME)
