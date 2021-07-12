FROM nginx

# add nginx.conf for directing to
COPY nginx.conf /etc/nginx

# export ports to allow connections on http(s?)
EXPOSE 80/tcp
EXPOSE 443/tcp

CMD ["nginx", "-g", "daemon off;"]
