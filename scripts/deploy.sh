#!/bin/bash

cp template.yaml build/dist
cp samconfig.toml build/dist
cd build/dist
sam deploy