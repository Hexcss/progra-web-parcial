# Paquete de prompts y skills - Practica 2 Flask

Este paquete contiene una guia agentica para refactorizar el backend actual de NestJS a Flask cumpliendo la Practica 2.

## Archivos

- `PROMPT.md`: prompt maestro para ejecutar la migracion completa.
- `skills/00-contract-audit/SKILL.md`: auditoria del contrato NestJS/Svelte.
- `skills/01-flask-architecture/SKILL.md`: estructura Flask por capas.
- `skills/02-auth-jwt-roles/SKILL.md`: autenticacion JWT, cookies y roles.
- `skills/03-sqlalchemy-repositories/SKILL.md`: persistencia real y repositorios.
- `skills/04-validation-errors/SKILL.md`: Marshmallow y errores globales.
- `skills/05-resource-migration/SKILL.md`: migracion de recursos y endpoints.
- `skills/06-tests-readme-ai-memory/SKILL.md`: tests, README y memoria de IA.

## Uso recomendado

1. Copia `PROMPT.md` a la raiz del repositorio o usalo como prompt principal para el agente.
2. Copia la carpeta `skills/` en el contexto de trabajo de tu agente/coding assistant.
3. Ejecuta la migracion por fases, no todo de golpe.
4. Mantén el frontend Svelte 5 como fuente de verdad del contrato consumido.
5. Documenta en la memoria de IA cada prompt real utilizado, iteracion, error de IA y correccion manual.
