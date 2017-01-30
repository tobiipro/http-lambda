export TOP := $(abspath $(shell dirname $(lastword $(MAKEFILE_LIST)))/../..)
include $(TOP)/support/mk/Makefile.pkg.mk

# ------------------------------------------------------------------------------

.PHONY: build
build: package.dir-symlink
