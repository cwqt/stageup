FROM nginx

# add nginx.conf for directing to
COPY nginx.conf /etc/nginx

# export ports to allow http connections on http(s?)
EXPOSE 80/tcp
EXPOSE 443/tcp

# envsubstr moves nginx.conf.template to conf.d folder
CMD ["nginx", "-g", "daemon off;"]
