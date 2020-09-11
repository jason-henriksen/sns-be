
del .\build\dist\template.yaml
del .\build\dist\samconfig.toml

copy template.yaml .\build\dist
copy samconfig.toml .\build\dist

cd build/dist

sam deploy