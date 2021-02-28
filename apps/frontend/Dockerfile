FROM nginx

COPY dist/apps/frontend/* /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]