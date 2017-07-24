ifeq (,$(wildcard core.inc.mk/Makefile))
INSTALL_CORE_INC_MK := $(shell git submodule update --init --recursive core.inc.mk)
ifneq (,$(filter undefine,$(.FEATURES)))
undefine INSTALL_CORE_INC_MK
endif
endif

TOP := $(abspath $(shell dirname $(lastword $(MAKEFILE_LIST))))
include core.inc.mk/Makefile

PATH := $(GIT_ROOT)/node_modules/.bin:$(PATH)
PATH := $(MAKE_PATH)/node_modules/.bin:$(PATH)
export PATH

# JS_FILES = $(shell $(FIND_Q) src -type f -name "*.js" -print)
JS_FILES := index.js

EC_FILES := $(shell $(GIT) ls-files | $(GREP) -v -e "^package-lock.json$$" -e "^LICENSE$$" | $(SED) "s/^/'/g" | $(SED) "s/$$/'/g")

ECLINT_ARGS := --max_line_length 1024
ESLINT_ARGS := --config $(MAKE_PATH)/node_modules/eslint-config-firecloud/no-ide.yaml

ECLINT := $(shell PATH="$(PATH)" $(WHICH_Q) eclint || echo "ECLINT_NOT_FOUND")
NPM_PUBLISH_GIT := $(shell $(WHICH_Q) npm-publish-git || echo "NPM_PUBLISH_GIT_NOT_FOUND")

# ------------------------------------------------------------------------------

.PHONY: all
all: deps build check


.PHONY: deps
deps:
	$(GIT) submodule sync
	$(GIT) submodule update --init --recursive
	$(NPM) install --ignore-scripts --no-package-lock
	node_modules/eslint-config-firecloud/npm-install-peer-dependencies

.PHONY: build
build:
	:


.PHONY: lint-ec
lint-ec:
	$(ECLINT) check $(ECLINT_ARGS) $(EC_FILES) || { \
		$(ECLINT) fix $(ECLINT_ARGS) $(EC_FILES) 2>/dev/null >&2; \
		exit 1; \
	}


.PHONY: lint-js
lint-js:
	$(ESLINT) $(ESLINT_ARGS) $(JS_FILES) || { \
		$(ESLINT) $(ESLINT_ARGS) --fix $(JS_FILES) 2>/dev/null >&2; \
		exit 1; \
	}


.PHONY: lint
lint: lint-ec lint-js


.PHONY: check
check: lint


.PHONY: publish
publish:
	$(NPM_PUBLISH_GIT)


.PHONY: publish/%
publish/%:
	$(NPM_PUBLISH_GIT) --tag ${*}


.PHONY: package-json-prepare
ifneq (node_modules,$(shell basename $(abspath ..))) # let Makefile build, or else build runs twice
package-json-prepare:
	:
else # installing as dependency
package-json-prepare: build
endif
