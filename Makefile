ifeq (,$(wildcard support-firecloud/Makefile))
INSTALL_SUPPORT_FIRECLOUD := $(shell git submodule update --init --recursive support-firecloud)
ifneq (,$(filter undefine,$(.FEATURES)))
undefine INSTALL_SUPPORT_FIRECLOUD
endif
endif

include support-firecloud/repo/Makefile.pkg.node.mk

# ------------------------------------------------------------------------------

.PHONY: deps-npm
deps-npm:
	$(NPM) install --no-package-lock
	node_modules/eslint-config-firecloud/npm-install-peer-dependencies
