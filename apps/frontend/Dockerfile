FROM nginx

# copy all locales, en, nb etc into html
COPY dist/apps/frontend/ /usr/share/nginx/html/
# FIXME: temporary hack to get assets in the root for angular to reference
COPY dist/apps/frontend/en/assets/ /usr/share/nginx/html/assets/

# move template over for env var substitution from envsubstr
COPY dist/apps/frontend/nginx/nginx.conf.template /etc/nginx/templates/
# include security-headers
COPY dist/apps/frontend/nginx/security-headers.conf /etc/nginx/security-headers.conf

# now we don't need this in the dist since we moved it
RUN rm -rf /usr/share/nginx/html/nginx

# export ports to allow http connections on http(s?)
EXPOSE 80/tcp
EXPOSE 443/tcp

# envsubstr moves nginx.conf.template to conf.d folder
CMD ["nginx", "-c", "/etc/nginx/conf.d/nginx.conf", "-g", "daemon off;"]