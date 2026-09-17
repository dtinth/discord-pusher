FROM denoland/deno:alpine-2.5.6

WORKDIR /app

COPY deno.json deno.lock ./
COPY main.ts ./
COPY src ./src

RUN deno cache main.ts

EXPOSE 8000

USER deno

CMD ["run", "--allow-net", "--allow-env", "main.ts"]
