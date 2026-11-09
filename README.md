```md
services:
  api_server:
    image: node:26-alpine
    container_name: node_api_server
    user: "${UID:-1000}:${GID:-1000}"
    working_dir: /app
    volumes:
      - ./:/app
    env_file:
      - .env
    ports:
      - "3000:3000"
    stdin_open: true
    tty: true
    command: sh -c "tail -f /dev/null"
    networks:
      - app-network
    depends_on:
      mongodb:
        condition: service_healthy

  mongodb:
    image: mongo:latest
    container_name: mongodb
    restart: unless-stopped

    ports:
      - "27017:27017"

    environment:
      MONGO_INITDB_ROOT_USERNAME: blue
      MONGO_INITDB_ROOT_PASSWORD: adminfjsl90vvv

    volumes:
      - mongodb_data:/data/db
      - ./mongo:/etc/mongo:ro,Z

    networks:
      - app-network

    command: >
      mongod
      --replSet rs0
      --auth
      --keyFile /etc/mongo/mongo-keyfile
      --bind_ip_all

    healthcheck:
      test: 'mongosh --port 27017 --eval "db.runCommand({ping: 1})" --quiet || exit 1'
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 5s

volumes:
  mongodb_data:

networks:
  app-network:
    driver: bridge
```
