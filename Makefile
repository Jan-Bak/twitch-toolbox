.PHONY: help release retag

.DEFAULT_GOAL := help

help: ## Show this menu
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z0-9_-]+:.*?## / {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

retag: ## Delete and recreate a tag to re-trigger release (usage: make retag VERSION=1.0.0)
ifndef VERSION
	$(error VERSION is not set. Usage: make retag VERSION=1.0.0)
endif
	@echo "Deleting tag v$(VERSION) locally and remotely..."
	-git tag -d v$(VERSION)
	-git push origin :refs/tags/v$(VERSION)
	@echo "Recreating tag v$(VERSION) on current HEAD..."
	git tag v$(VERSION)
	git push origin v$(VERSION)
	@echo "Re-pushed tag v$(VERSION) — check Actions tab and delete any leftover draft release manually if needed."

release: ## Bump version, tag and push to trigger release (usage: make release VERSION=0.2.0)
ifndef VERSION
	$(error VERSION is not set. Usage: make release VERSION=0.2.0)
endif
	@git diff --quiet || (echo "Working tree is dirty. Commit or stash changes first." && exit 1)
	@current_branch=$$(git rev-parse --abbrev-ref HEAD); \
	if [ "$$current_branch" != "main" ]; then \
		echo "You're on '$$current_branch', not 'main'. Releases should be tagged from main."; \
		exit 1; \
	fi
	@git fetch origin
	@local_head=$$(git rev-parse HEAD); \
	remote_head=$$(git rev-parse origin/main); \
	if [ "$$local_head" != "$$remote_head" ]; then \
		echo "Local main is not in sync with origin/main. Pull or push first."; \
		exit 1; \
	fi
	node scripts/bump-version.mjs $(VERSION)
	git add package.json src-tauri/tauri.conf.json
	git commit -m "chore: release v$(VERSION)"
	git tag v$(VERSION)
	git push origin main
	git push origin v$(VERSION)
	@echo "Pushed tag v$(VERSION) — release workflow should now trigger on GitHub."