# Stage 1: Build the Rust application
FROM rust:1.77-slim-bookworm as builder

WORKDIR /usr/src/app
COPY Cargo.toml Cargo.lock* ./
COPY src ./src
COPY templates ./templates

# Build the application
RUN cargo build --release

# Stage 2: Create the runtime image Let's use a minimal debian image
FROM debian:bookworm-slim

WORKDIR /app

# Install necessary runtime dependencies
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the compiled binary from the builder stage
COPY --from=builder /usr/src/app/target/release/htmx-rust /app/htmx-rust

# Copy static assets (Node generates HTMX into dist/ and we have public/)
# For this server to work, we need both.
COPY public /app/public
COPY dist /app/dist

# Define environment variables with defaults
ENV PORT=3000
ENV DATA_DIR=/.data

EXPOSE 3000

# Run the binary
CMD ["/app/htmx-rust"]
