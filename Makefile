CLEAN_EXTS := aux dvi hst lof toc ver log pyc

docs: charter SRS
	
charter:
	cd docs/charter; pdflatex project_charter.tex

SRS:
	cd docs/SRS; pdflatex system_requirements_specification.tex
clean:
	$(foreach ext,$(CLEAN_EXTS),find . -name '*.$(ext)' -delete;)
