FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY starken-os.html /usr/share/nginx/html/starken-os.html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1
