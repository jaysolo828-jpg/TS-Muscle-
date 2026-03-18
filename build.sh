#!/bin/sh
printf "window.ANTHROPIC_API_KEY = '%s';\n" "$ANTHROPIC_API_KEY" > config.js
