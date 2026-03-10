+++
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
description = ""
dataset_url = "/data/{{ .File.ContentBaseName }}.csv"
layout = "example-viz"
date = '{{ .Date }}'
draft = true
+++
