docker build -t Digital-Republic-Group/blob-storage-angular .

docker tag Digital-Republic-Group/blob-storage-angular stottlecontainerregistry.azurecr.io/blob-storage-angular

docker run -p 4201:80 --rm stottlecontainerregistry.azurecr.io/blob-storage-angular

# docker push stottlecontainerregistry.azurecr.io/blob-storage-angular