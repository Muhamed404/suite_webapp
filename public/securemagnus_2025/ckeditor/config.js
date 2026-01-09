/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see https://ckeditor.com/legal/ckeditor-oss-license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here. For example:
	// config.language = 'fr';
	// config.uiColor = '#AADC6E';
	CKEDITOR.config.versionCheck = false;
	CKEDITOR.config.allowedContent=true;
	CKEDITOR.filter.disallowedContentRules=false;
	CKEDITOR.config.width = 'auto';
	CKEDITOR.config.height = 'auto';
	// CKEDITOR.config.autoGrow_onStartup = true; // Automatically grow on startup
    // CKEDITOR.config.autoGrow_bottomSpace = 50; // Space to leave at the bottom
    // CKEDITOR.config.autoGrow_maxHeight = 600; // Maximum height for the editor
};
