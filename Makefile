.PHONY: up down logs shell build

up:
	@if [ ! -f .env ]; then cp .env.example .env && echo "Created .env from .env.example"; fi
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f backend

build:
	docker compose build

shell:
	docker compose exec backend sh
