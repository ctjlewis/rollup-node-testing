function createCommonjsModule(fn, basedir, module) {
	return module = {
	  path: basedir,
	  exports: {},
	  require: function (path, base) {
      return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    }
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var AbbrRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var AbbrRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'abbr'
    }
  }],
  type: 'structure'
};
var _default = AbbrRole;
exports["default"] = _default;
});

var AlertDialogRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var AlertDialogRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'alertdialog'
    }
  }],
  type: 'window'
};
var _default = AlertDialogRole;
exports["default"] = _default;
});

var AlertRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var AlertRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'alert'
    }
  }],
  type: 'structure'
};
var _default = AlertRole;
exports["default"] = _default;
});

var AnnotationRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var AnnotationRole = {
  relatedConcepts: [],
  type: 'structure'
};
var _default = AnnotationRole;
exports["default"] = _default;
});

var ApplicationRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ApplicationRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'application'
    }
  }],
  type: 'window'
};
var _default = ApplicationRole;
exports["default"] = _default;
});

var ArticleRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ArticleRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'article'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'article'
    }
  }],
  type: 'structure'
};
var _default = ArticleRole;
exports["default"] = _default;
});

var AudioRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var AudioRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'audio'
    }
  }],
  type: 'widget'
};
var _default = AudioRole;
exports["default"] = _default;
});

var BannerRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var BannerRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'banner'
    }
  }],
  type: 'structure'
};
var _default = BannerRole;
exports["default"] = _default;
});

var BlockquoteRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var BlockquoteRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'blockquote'
    }
  }],
  type: 'structure'
};
var _default = BlockquoteRole;
exports["default"] = _default;
});

var BusyIndicatorRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var BusyIndicatorRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      attributes: [{
        name: 'aria-busy',
        value: 'true'
      }]
    }
  }],
  type: 'widget'
};
var _default = BusyIndicatorRole;
exports["default"] = _default;
});

var ButtonRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ButtonRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'button'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'button'
    }
  }],
  type: 'widget'
};
var _default = ButtonRole;
exports["default"] = _default;
});

var CanvasRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var CanvasRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'canvas'
    }
  }],
  type: 'widget'
};
var _default = CanvasRole;
exports["default"] = _default;
});

var CaptionRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var CaptionRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'caption'
    }
  }],
  type: 'structure'
};
var _default = CaptionRole;
exports["default"] = _default;
});

var CellRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var CellRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'cell'
    }
  }, {
    module: 'ARIA',
    concept: {
      name: 'gridcell'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'td'
    }
  }],
  type: 'widget'
};
var _default = CellRole;
exports["default"] = _default;
});

var CheckBoxRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var CheckBoxRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'checkbox'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'input',
      attributes: [{
        name: 'type',
        value: 'checkbox'
      }]
    }
  }],
  type: 'widget'
};
var _default = CheckBoxRole;
exports["default"] = _default;
});

var ColorWellRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ColorWellRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'input',
      attributes: [{
        name: 'type',
        value: 'color'
      }]
    }
  }],
  type: 'widget'
};
var _default = ColorWellRole;
exports["default"] = _default;
});

var ColumnHeaderRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ColumnHeaderRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'columnheader'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'th'
    }
  }],
  type: 'widget'
};
var _default = ColumnHeaderRole;
exports["default"] = _default;
});

var ColumnRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ColumnRole = {
  relatedConcepts: [],
  type: 'structure'
};
var _default = ColumnRole;
exports["default"] = _default;
});

var ComboBoxRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ComboBoxRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'combobox'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'select'
    }
  }],
  type: 'widget'
};
var _default = ComboBoxRole;
exports["default"] = _default;
});

var ComplementaryRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ComplementaryRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'complementary'
    }
  }],
  type: 'structure'
};
var _default = ComplementaryRole;
exports["default"] = _default;
});

var ContentInfoRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ContentInfoRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'structureinfo'
    }
  }],
  type: 'structure'
};
var _default = ContentInfoRole;
exports["default"] = _default;
});

var DateRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var DateRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'input',
      attributes: [{
        name: 'type',
        value: 'date'
      }]
    }
  }],
  type: 'widget'
};
var _default = DateRole;
exports["default"] = _default;
});

var DateTimeRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var DateTimeRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'input',
      attributes: [{
        name: 'type',
        value: 'datetime'
      }]
    }
  }],
  type: 'widget'
};
var _default = DateTimeRole;
exports["default"] = _default;
});

var DefinitionRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var DefinitionRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'dfn'
    }
  }],
  type: 'structure'
};
var _default = DefinitionRole;
exports["default"] = _default;
});

var DescriptionListDetailRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var DescriptionListDetailRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'dd'
    }
  }],
  type: 'structure'
};
var _default = DescriptionListDetailRole;
exports["default"] = _default;
});

var DescriptionListRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var DescriptionListRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'dl'
    }
  }],
  type: 'structure'
};
var _default = DescriptionListRole;
exports["default"] = _default;
});

var DescriptionListTermRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var DescriptionListTermRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'dt'
    }
  }],
  type: 'structure'
};
var _default = DescriptionListTermRole;
exports["default"] = _default;
});

var DetailsRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var DetailsRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'details'
    }
  }],
  type: 'structure'
};
var _default = DetailsRole;
exports["default"] = _default;
});

var DialogRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var DialogRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'dialog'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'dialog'
    }
  }],
  type: 'window'
};
var _default = DialogRole;
exports["default"] = _default;
});

var DirectoryRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var DirectoryRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'directory'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'dir'
    }
  }],
  type: 'structure'
};
var _default = DirectoryRole;
exports["default"] = _default;
});

var DisclosureTriangleRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var DisclosureTriangleRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'summary'
    }
  }],
  type: 'widget'
};
var _default = DisclosureTriangleRole;
exports["default"] = _default;
});

var DivRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var DivRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'div'
    }
  }],
  type: 'generic'
};
var _default = DivRole;
exports["default"] = _default;
});

var DocumentRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var DocumentRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'document'
    }
  }],
  type: 'structure'
};
var _default = DocumentRole;
exports["default"] = _default;
});

var EmbeddedObjectRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var EmbeddedObjectRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'embed'
    }
  }],
  type: 'widget'
};
var _default = EmbeddedObjectRole;
exports["default"] = _default;
});

var FeedRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var FeedRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'feed'
    }
  }],
  type: 'structure'
};
var _default = FeedRole;
exports["default"] = _default;
});

var FigcaptionRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var FigcaptionRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'figcaption'
    }
  }],
  type: 'structure'
};
var _default = FigcaptionRole;
exports["default"] = _default;
});

var FigureRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var FigureRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'figure'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'figure'
    }
  }],
  type: 'structure'
};
var _default = FigureRole;
exports["default"] = _default;
});

var FooterRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var FooterRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'footer'
    }
  }],
  type: 'structure'
};
var _default = FooterRole;
exports["default"] = _default;
});

var FormRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var FormRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'form'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'form'
    }
  }],
  type: 'structure'
};
var _default = FormRole;
exports["default"] = _default;
});

var GridRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var GridRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'grid'
    }
  }],
  type: 'widget'
};
var _default = GridRole;
exports["default"] = _default;
});

var GroupRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var GroupRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'group'
    }
  }],
  type: 'structure'
};
var _default = GroupRole;
exports["default"] = _default;
});

var HeadingRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var HeadingRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'heading'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'h1'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'h2'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'h3'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'h4'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'h5'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'h6'
    }
  }],
  type: 'structure'
};
var _default = HeadingRole;
exports["default"] = _default;
});

var IframePresentationalRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var IframePresentationalRole = {
  relatedConcepts: [],
  type: 'window'
};
var _default = IframePresentationalRole;
exports["default"] = _default;
});

var IframeRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var IframeRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'iframe'
    }
  }],
  type: 'window'
};
var _default = IframeRole;
exports["default"] = _default;
});

var IgnoredRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var IgnoredRole = {
  relatedConcepts: [],
  type: 'structure'
};
var _default = IgnoredRole;
exports["default"] = _default;
});

var ImageMapLinkRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ImageMapLinkRole = {
  relatedConcepts: [],
  type: 'widget'
};
var _default = ImageMapLinkRole;
exports["default"] = _default;
});

var ImageMapRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ImageMapRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'img',
      attributes: [{
        name: 'usemap'
      }]
    }
  }],
  type: 'structure'
};
var _default = ImageMapRole;
exports["default"] = _default;
});

var ImageRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ImageRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'img'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'img'
    }
  }],
  type: 'structure'
};
var _default = ImageRole;
exports["default"] = _default;
});

var InlineTextBoxRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var InlineTextBoxRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'input'
    }
  }],
  type: 'widget'
};
var _default = InlineTextBoxRole;
exports["default"] = _default;
});

var InputTimeRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var InputTimeRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'input',
      attributes: [{
        name: 'type',
        value: 'time'
      }]
    }
  }],
  type: 'widget'
};
var _default = InputTimeRole;
exports["default"] = _default;
});

var LabelRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var LabelRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'label'
    }
  }],
  type: 'structure'
};
var _default = LabelRole;
exports["default"] = _default;
});

var LegendRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var LegendRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'legend'
    }
  }],
  type: 'structure'
};
var _default = LegendRole;
exports["default"] = _default;
});

var LineBreakRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var LineBreakRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'br'
    }
  }],
  type: 'structure'
};
var _default = LineBreakRole;
exports["default"] = _default;
});

var LinkRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var LinkRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'link'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'a',
      attributes: [{
        name: 'href'
      }]
    }
  }],
  type: 'widget'
};
var _default = LinkRole;
exports["default"] = _default;
});

var ListBoxOptionRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ListBoxOptionRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'option'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'option'
    }
  }],
  type: 'widget'
};
var _default = ListBoxOptionRole;
exports["default"] = _default;
});

var ListBoxRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ListBoxRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'listbox'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'datalist'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'select'
    }
  }],
  type: 'widget'
};
var _default = ListBoxRole;
exports["default"] = _default;
});

var ListItemRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ListItemRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'listitem'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'li'
    }
  }],
  type: 'structure'
};
var _default = ListItemRole;
exports["default"] = _default;
});

var ListMarkerRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ListMarkerRole = {
  relatedConcepts: [],
  type: 'structure'
};
var _default = ListMarkerRole;
exports["default"] = _default;
});

var ListRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ListRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'list'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'ul'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'ol'
    }
  }],
  type: 'structure'
};
var _default = ListRole;
exports["default"] = _default;
});

var LogRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var LogRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'log'
    }
  }],
  type: 'structure'
};
var _default = LogRole;
exports["default"] = _default;
});

var MainRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var MainRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'main'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'main'
    }
  }],
  type: 'structure'
};
var _default = MainRole;
exports["default"] = _default;
});

var MarkRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var MarkRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'mark'
    }
  }],
  type: 'structure'
};
var _default = MarkRole;
exports["default"] = _default;
});

var MarqueeRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var MarqueeRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'marquee'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'marquee'
    }
  }],
  type: 'structure'
};
var _default = MarqueeRole;
exports["default"] = _default;
});

var MathRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var MathRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'math'
    }
  }],
  type: 'structure'
};
var _default = MathRole;
exports["default"] = _default;
});

var MenuBarRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var MenuBarRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'menubar'
    }
  }],
  type: 'structure'
};
var _default = MenuBarRole;
exports["default"] = _default;
});

var MenuButtonRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var MenuButtonRole = {
  relatedConcepts: [],
  type: 'widget'
};
var _default = MenuButtonRole;
exports["default"] = _default;
});

var MenuItemRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var MenuItemRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'menuitem'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'menuitem'
    }
  }],
  type: 'widget'
};
var _default = MenuItemRole;
exports["default"] = _default;
});

var MenuItemCheckBoxRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var MenuItemCheckBoxRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'menuitemcheckbox'
    }
  }],
  type: 'widget'
};
var _default = MenuItemCheckBoxRole;
exports["default"] = _default;
});

var MenuItemRadioRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var MenuItemRadioRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'menuitemradio'
    }
  }],
  type: 'widget'
};
var _default = MenuItemRadioRole;
exports["default"] = _default;
});

var MenuListOptionRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var MenuListOptionRole = {
  relatedConcepts: [],
  type: 'widget'
};
var _default = MenuListOptionRole;
exports["default"] = _default;
});

var MenuListPopupRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var MenuListPopupRole = {
  relatedConcepts: [],
  type: 'widget'
};
var _default = MenuListPopupRole;
exports["default"] = _default;
});

var MenuRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var MenuRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'menu'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'menu'
    }
  }],
  type: 'structure'
};
var _default = MenuRole;
exports["default"] = _default;
});

var MeterRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var MeterRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'meter'
    }
  }],
  type: 'structure'
};
var _default = MeterRole;
exports["default"] = _default;
});

var NavigationRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var NavigationRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'navigation'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'nav'
    }
  }],
  type: 'structure'
};
var _default = NavigationRole;
exports["default"] = _default;
});

var NoneRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var NoneRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'none'
    }
  }],
  type: 'structure'
};
var _default = NoneRole;
exports["default"] = _default;
});

var NoteRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var NoteRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'note'
    }
  }],
  type: 'structure'
};
var _default = NoteRole;
exports["default"] = _default;
});

var OutlineRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var OutlineRole = {
  relatedConcepts: [],
  type: 'structure'
};
var _default = OutlineRole;
exports["default"] = _default;
});

var ParagraphRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ParagraphRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'p'
    }
  }],
  type: 'structure'
};
var _default = ParagraphRole;
exports["default"] = _default;
});

var PopUpButtonRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var PopUpButtonRole = {
  relatedConcepts: [],
  type: 'widget'
};
var _default = PopUpButtonRole;
exports["default"] = _default;
});

var PreRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var PreRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'pre'
    }
  }],
  type: 'structure'
};
var _default = PreRole;
exports["default"] = _default;
});

var PresentationalRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var PresentationalRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'presentation'
    }
  }],
  type: 'structure'
};
var _default = PresentationalRole;
exports["default"] = _default;
});

var ProgressIndicatorRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ProgressIndicatorRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'progressbar'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'progress'
    }
  }],
  type: 'structure'
};
var _default = ProgressIndicatorRole;
exports["default"] = _default;
});

var RadioButtonRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var RadioButtonRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'radio'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'input',
      attributes: [{
        name: 'type',
        value: 'radio'
      }]
    }
  }],
  type: 'widget'
};
var _default = RadioButtonRole;
exports["default"] = _default;
});

var RadioGroupRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var RadioGroupRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'radiogroup'
    }
  }],
  type: 'structure'
};
var _default = RadioGroupRole;
exports["default"] = _default;
});

var RegionRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var RegionRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'region'
    }
  }],
  type: 'structure'
};
var _default = RegionRole;
exports["default"] = _default;
});

var RootWebAreaRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var RootWebAreaRole = {
  relatedConcepts: [],
  type: 'structure'
};
var _default = RootWebAreaRole;
exports["default"] = _default;
});

var RowHeaderRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var RowHeaderRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'rowheader'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'th',
      attributes: [{
        name: 'scope',
        value: 'row'
      }]
    }
  }],
  type: 'widget'
};
var _default = RowHeaderRole;
exports["default"] = _default;
});

var RowRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var RowRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'row'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'tr'
    }
  }],
  type: 'structure'
};
var _default = RowRole;
exports["default"] = _default;
});

var RubyRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var RubyRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'ruby'
    }
  }],
  type: 'structure'
};
var _default = RubyRole;
exports["default"] = _default;
});

var RulerRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var RulerRole = {
  relatedConcepts: [],
  type: 'structure'
};
var _default = RulerRole;
exports["default"] = _default;
});

var ScrollAreaRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ScrollAreaRole = {
  relatedConcepts: [],
  type: 'structure'
};
var _default = ScrollAreaRole;
exports["default"] = _default;
});

var ScrollBarRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ScrollBarRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'scrollbar'
    }
  }],
  type: 'widget'
};
var _default = ScrollBarRole;
exports["default"] = _default;
});

var SeamlessWebAreaRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var SeamlessWebAreaRole = {
  relatedConcepts: [],
  type: 'structure'
};
var _default = SeamlessWebAreaRole;
exports["default"] = _default;
});

var SearchRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var SearchRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'search'
    }
  }],
  type: 'structure'
};
var _default = SearchRole;
exports["default"] = _default;
});

var SearchBoxRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var SearchBoxRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'searchbox'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'input',
      attributes: [{
        name: 'type',
        value: 'search'
      }]
    }
  }],
  type: 'widget'
};
var _default = SearchBoxRole;
exports["default"] = _default;
});

var SliderRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var SliderRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'slider'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'input',
      attributes: [{
        name: 'type',
        value: 'range'
      }]
    }
  }],
  type: 'widget'
};
var _default = SliderRole;
exports["default"] = _default;
});

var SliderThumbRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var SliderThumbRole = {
  relatedConcepts: [],
  type: 'structure'
};
var _default = SliderThumbRole;
exports["default"] = _default;
});

var SpinButtonRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var SpinButtonRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'spinbutton'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'input',
      attributes: [{
        name: 'type',
        value: 'number'
      }]
    }
  }],
  type: 'widget'
};
var _default = SpinButtonRole;
exports["default"] = _default;
});

var SpinButtonPartRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var SpinButtonPartRole = {
  relatedConcepts: [],
  type: 'structure'
};
var _default = SpinButtonPartRole;
exports["default"] = _default;
});

var SplitterRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var SplitterRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'separator'
    }
  }],
  type: 'widget'
};
var _default = SplitterRole;
exports["default"] = _default;
});

var StaticTextRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var StaticTextRole = {
  relatedConcepts: [],
  type: 'structure'
};
var _default = StaticTextRole;
exports["default"] = _default;
});

var StatusRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var StatusRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'status'
    }
  }],
  type: 'structure'
};
var _default = StatusRole;
exports["default"] = _default;
});

var SVGRootRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var SVGRootRole = {
  relatedConcepts: [],
  type: 'structure'
};
var _default = SVGRootRole;
exports["default"] = _default;
});

var SwitchRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var SwitchRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'switch'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'input',
      attributes: [{
        name: 'type',
        value: 'checkbox'
      }]
    }
  }],
  type: 'widget'
};
var _default = SwitchRole;
exports["default"] = _default;
});

var TabGroupRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var TabGroupRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'tablist'
    }
  }],
  type: 'structure'
};
var _default = TabGroupRole;
exports["default"] = _default;
});

var TabRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var TabRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'tab'
    }
  }],
  type: 'widget'
};
var _default = TabRole;
exports["default"] = _default;
});

var TableHeaderContainerRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var TableHeaderContainerRole = {
  relatedConcepts: [],
  type: 'structure'
};
var _default = TableHeaderContainerRole;
exports["default"] = _default;
});

var TableRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var TableRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'table'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'table'
    }
  }],
  type: 'structure'
};
var _default = TableRole;
exports["default"] = _default;
});

var TabListRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var TabListRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'tablist'
    }
  }],
  type: 'structure'
};
var _default = TabListRole;
exports["default"] = _default;
});

var TabPanelRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var TabPanelRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'tabpanel'
    }
  }],
  type: 'structure'
};
var _default = TabPanelRole;
exports["default"] = _default;
});

var TermRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var TermRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'term'
    }
  }],
  type: 'structure'
};
var _default = TermRole;
exports["default"] = _default;
});

var TextFieldRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var TextFieldRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'textbox'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'input'
    }
  }, {
    module: 'HTML',
    concept: {
      name: 'input',
      attributes: [{
        name: 'type',
        value: 'text'
      }]
    }
  }],
  type: 'widget'
};
var _default = TextFieldRole;
exports["default"] = _default;
});

var TimeRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var TimeRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'time'
    }
  }],
  type: 'structure'
};
var _default = TimeRole;
exports["default"] = _default;
});

var TimerRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var TimerRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'timer'
    }
  }],
  type: 'structure'
};
var _default = TimerRole;
exports["default"] = _default;
});

var ToggleButtonRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ToggleButtonRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      attributes: [{
        name: 'aria-pressed'
      }]
    }
  }],
  type: 'widget'
};
var _default = ToggleButtonRole;
exports["default"] = _default;
});

var ToolbarRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var ToolbarRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'toolbar'
    }
  }],
  type: 'structure'
};
var _default = ToolbarRole;
exports["default"] = _default;
});

var TreeRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var TreeRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'tree'
    }
  }],
  type: 'widget'
};
var _default = TreeRole;
exports["default"] = _default;
});

var TreeGridRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var TreeGridRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'treegrid'
    }
  }],
  type: 'widget'
};
var _default = TreeGridRole;
exports["default"] = _default;
});

var TreeItemRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var TreeItemRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'treeitem'
    }
  }],
  type: 'widget'
};
var _default = TreeItemRole;
exports["default"] = _default;
});

var UserInterfaceTooltipRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var UserInterfaceTooltipRole = {
  relatedConcepts: [{
    module: 'ARIA',
    concept: {
      name: 'tooltip'
    }
  }],
  type: 'structure'
};
var _default = UserInterfaceTooltipRole;
exports["default"] = _default;
});

var VideoRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var VideoRole = {
  relatedConcepts: [{
    module: 'HTML',
    concept: {
      name: 'video'
    }
  }],
  type: 'widget'
};
var _default = VideoRole;
exports["default"] = _default;
});

var WebAreaRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var WebAreaRole = {
  relatedConcepts: [],
  type: 'structure'
};
var _default = WebAreaRole;
exports["default"] = _default;
});

var WindowRole_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var WindowRole = {
  relatedConcepts: [],
  type: 'window'
};
var _default = WindowRole;
exports["default"] = _default;
});

var AXObjectsMap_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _AbbrRole = _interopRequireDefault(AbbrRole_1);

var _AlertDialogRole = _interopRequireDefault(AlertDialogRole_1);

var _AlertRole = _interopRequireDefault(AlertRole_1);

var _AnnotationRole = _interopRequireDefault(AnnotationRole_1);

var _ApplicationRole = _interopRequireDefault(ApplicationRole_1);

var _ArticleRole = _interopRequireDefault(ArticleRole_1);

var _AudioRole = _interopRequireDefault(AudioRole_1);

var _BannerRole = _interopRequireDefault(BannerRole_1);

var _BlockquoteRole = _interopRequireDefault(BlockquoteRole_1);

var _BusyIndicatorRole = _interopRequireDefault(BusyIndicatorRole_1);

var _ButtonRole = _interopRequireDefault(ButtonRole_1);

var _CanvasRole = _interopRequireDefault(CanvasRole_1);

var _CaptionRole = _interopRequireDefault(CaptionRole_1);

var _CellRole = _interopRequireDefault(CellRole_1);

var _CheckBoxRole = _interopRequireDefault(CheckBoxRole_1);

var _ColorWellRole = _interopRequireDefault(ColorWellRole_1);

var _ColumnHeaderRole = _interopRequireDefault(ColumnHeaderRole_1);

var _ColumnRole = _interopRequireDefault(ColumnRole_1);

var _ComboBoxRole = _interopRequireDefault(ComboBoxRole_1);

var _ComplementaryRole = _interopRequireDefault(ComplementaryRole_1);

var _ContentInfoRole = _interopRequireDefault(ContentInfoRole_1);

var _DateRole = _interopRequireDefault(DateRole_1);

var _DateTimeRole = _interopRequireDefault(DateTimeRole_1);

var _DefinitionRole = _interopRequireDefault(DefinitionRole_1);

var _DescriptionListDetailRole = _interopRequireDefault(DescriptionListDetailRole_1);

var _DescriptionListRole = _interopRequireDefault(DescriptionListRole_1);

var _DescriptionListTermRole = _interopRequireDefault(DescriptionListTermRole_1);

var _DetailsRole = _interopRequireDefault(DetailsRole_1);

var _DialogRole = _interopRequireDefault(DialogRole_1);

var _DirectoryRole = _interopRequireDefault(DirectoryRole_1);

var _DisclosureTriangleRole = _interopRequireDefault(DisclosureTriangleRole_1);

var _DivRole = _interopRequireDefault(DivRole_1);

var _DocumentRole = _interopRequireDefault(DocumentRole_1);

var _EmbeddedObjectRole = _interopRequireDefault(EmbeddedObjectRole_1);

var _FeedRole = _interopRequireDefault(FeedRole_1);

var _FigcaptionRole = _interopRequireDefault(FigcaptionRole_1);

var _FigureRole = _interopRequireDefault(FigureRole_1);

var _FooterRole = _interopRequireDefault(FooterRole_1);

var _FormRole = _interopRequireDefault(FormRole_1);

var _GridRole = _interopRequireDefault(GridRole_1);

var _GroupRole = _interopRequireDefault(GroupRole_1);

var _HeadingRole = _interopRequireDefault(HeadingRole_1);

var _IframePresentationalRole = _interopRequireDefault(IframePresentationalRole_1);

var _IframeRole = _interopRequireDefault(IframeRole_1);

var _IgnoredRole = _interopRequireDefault(IgnoredRole_1);

var _ImageMapLinkRole = _interopRequireDefault(ImageMapLinkRole_1);

var _ImageMapRole = _interopRequireDefault(ImageMapRole_1);

var _ImageRole = _interopRequireDefault(ImageRole_1);

var _InlineTextBoxRole = _interopRequireDefault(InlineTextBoxRole_1);

var _InputTimeRole = _interopRequireDefault(InputTimeRole_1);

var _LabelRole = _interopRequireDefault(LabelRole_1);

var _LegendRole = _interopRequireDefault(LegendRole_1);

var _LineBreakRole = _interopRequireDefault(LineBreakRole_1);

var _LinkRole = _interopRequireDefault(LinkRole_1);

var _ListBoxOptionRole = _interopRequireDefault(ListBoxOptionRole_1);

var _ListBoxRole = _interopRequireDefault(ListBoxRole_1);

var _ListItemRole = _interopRequireDefault(ListItemRole_1);

var _ListMarkerRole = _interopRequireDefault(ListMarkerRole_1);

var _ListRole = _interopRequireDefault(ListRole_1);

var _LogRole = _interopRequireDefault(LogRole_1);

var _MainRole = _interopRequireDefault(MainRole_1);

var _MarkRole = _interopRequireDefault(MarkRole_1);

var _MarqueeRole = _interopRequireDefault(MarqueeRole_1);

var _MathRole = _interopRequireDefault(MathRole_1);

var _MenuBarRole = _interopRequireDefault(MenuBarRole_1);

var _MenuButtonRole = _interopRequireDefault(MenuButtonRole_1);

var _MenuItemRole = _interopRequireDefault(MenuItemRole_1);

var _MenuItemCheckBoxRole = _interopRequireDefault(MenuItemCheckBoxRole_1);

var _MenuItemRadioRole = _interopRequireDefault(MenuItemRadioRole_1);

var _MenuListOptionRole = _interopRequireDefault(MenuListOptionRole_1);

var _MenuListPopupRole = _interopRequireDefault(MenuListPopupRole_1);

var _MenuRole = _interopRequireDefault(MenuRole_1);

var _MeterRole = _interopRequireDefault(MeterRole_1);

var _NavigationRole = _interopRequireDefault(NavigationRole_1);

var _NoneRole = _interopRequireDefault(NoneRole_1);

var _NoteRole = _interopRequireDefault(NoteRole_1);

var _OutlineRole = _interopRequireDefault(OutlineRole_1);

var _ParagraphRole = _interopRequireDefault(ParagraphRole_1);

var _PopUpButtonRole = _interopRequireDefault(PopUpButtonRole_1);

var _PreRole = _interopRequireDefault(PreRole_1);

var _PresentationalRole = _interopRequireDefault(PresentationalRole_1);

var _ProgressIndicatorRole = _interopRequireDefault(ProgressIndicatorRole_1);

var _RadioButtonRole = _interopRequireDefault(RadioButtonRole_1);

var _RadioGroupRole = _interopRequireDefault(RadioGroupRole_1);

var _RegionRole = _interopRequireDefault(RegionRole_1);

var _RootWebAreaRole = _interopRequireDefault(RootWebAreaRole_1);

var _RowHeaderRole = _interopRequireDefault(RowHeaderRole_1);

var _RowRole = _interopRequireDefault(RowRole_1);

var _RubyRole = _interopRequireDefault(RubyRole_1);

var _RulerRole = _interopRequireDefault(RulerRole_1);

var _ScrollAreaRole = _interopRequireDefault(ScrollAreaRole_1);

var _ScrollBarRole = _interopRequireDefault(ScrollBarRole_1);

var _SeamlessWebAreaRole = _interopRequireDefault(SeamlessWebAreaRole_1);

var _SearchRole = _interopRequireDefault(SearchRole_1);

var _SearchBoxRole = _interopRequireDefault(SearchBoxRole_1);

var _SliderRole = _interopRequireDefault(SliderRole_1);

var _SliderThumbRole = _interopRequireDefault(SliderThumbRole_1);

var _SpinButtonRole = _interopRequireDefault(SpinButtonRole_1);

var _SpinButtonPartRole = _interopRequireDefault(SpinButtonPartRole_1);

var _SplitterRole = _interopRequireDefault(SplitterRole_1);

var _StaticTextRole = _interopRequireDefault(StaticTextRole_1);

var _StatusRole = _interopRequireDefault(StatusRole_1);

var _SVGRootRole = _interopRequireDefault(SVGRootRole_1);

var _SwitchRole = _interopRequireDefault(SwitchRole_1);

var _TabGroupRole = _interopRequireDefault(TabGroupRole_1);

var _TabRole = _interopRequireDefault(TabRole_1);

var _TableHeaderContainerRole = _interopRequireDefault(TableHeaderContainerRole_1);

var _TableRole = _interopRequireDefault(TableRole_1);

var _TabListRole = _interopRequireDefault(TabListRole_1);

var _TabPanelRole = _interopRequireDefault(TabPanelRole_1);

var _TermRole = _interopRequireDefault(TermRole_1);

var _TextFieldRole = _interopRequireDefault(TextFieldRole_1);

var _TimeRole = _interopRequireDefault(TimeRole_1);

var _TimerRole = _interopRequireDefault(TimerRole_1);

var _ToggleButtonRole = _interopRequireDefault(ToggleButtonRole_1);

var _ToolbarRole = _interopRequireDefault(ToolbarRole_1);

var _TreeRole = _interopRequireDefault(TreeRole_1);

var _TreeGridRole = _interopRequireDefault(TreeGridRole_1);

var _TreeItemRole = _interopRequireDefault(TreeItemRole_1);

var _UserInterfaceTooltipRole = _interopRequireDefault(UserInterfaceTooltipRole_1);

var _VideoRole = _interopRequireDefault(VideoRole_1);

var _WebAreaRole = _interopRequireDefault(WebAreaRole_1);

var _WindowRole = _interopRequireDefault(WindowRole_1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var AXObjectsMap = new Map([['AbbrRole', _AbbrRole["default"]], ['AlertDialogRole', _AlertDialogRole["default"]], ['AlertRole', _AlertRole["default"]], ['AnnotationRole', _AnnotationRole["default"]], ['ApplicationRole', _ApplicationRole["default"]], ['ArticleRole', _ArticleRole["default"]], ['AudioRole', _AudioRole["default"]], ['BannerRole', _BannerRole["default"]], ['BlockquoteRole', _BlockquoteRole["default"]], ['BusyIndicatorRole', _BusyIndicatorRole["default"]], ['ButtonRole', _ButtonRole["default"]], ['CanvasRole', _CanvasRole["default"]], ['CaptionRole', _CaptionRole["default"]], ['CellRole', _CellRole["default"]], ['CheckBoxRole', _CheckBoxRole["default"]], ['ColorWellRole', _ColorWellRole["default"]], ['ColumnHeaderRole', _ColumnHeaderRole["default"]], ['ColumnRole', _ColumnRole["default"]], ['ComboBoxRole', _ComboBoxRole["default"]], ['ComplementaryRole', _ComplementaryRole["default"]], ['ContentInfoRole', _ContentInfoRole["default"]], ['DateRole', _DateRole["default"]], ['DateTimeRole', _DateTimeRole["default"]], ['DefinitionRole', _DefinitionRole["default"]], ['DescriptionListDetailRole', _DescriptionListDetailRole["default"]], ['DescriptionListRole', _DescriptionListRole["default"]], ['DescriptionListTermRole', _DescriptionListTermRole["default"]], ['DetailsRole', _DetailsRole["default"]], ['DialogRole', _DialogRole["default"]], ['DirectoryRole', _DirectoryRole["default"]], ['DisclosureTriangleRole', _DisclosureTriangleRole["default"]], ['DivRole', _DivRole["default"]], ['DocumentRole', _DocumentRole["default"]], ['EmbeddedObjectRole', _EmbeddedObjectRole["default"]], ['FeedRole', _FeedRole["default"]], ['FigcaptionRole', _FigcaptionRole["default"]], ['FigureRole', _FigureRole["default"]], ['FooterRole', _FooterRole["default"]], ['FormRole', _FormRole["default"]], ['GridRole', _GridRole["default"]], ['GroupRole', _GroupRole["default"]], ['HeadingRole', _HeadingRole["default"]], ['IframePresentationalRole', _IframePresentationalRole["default"]], ['IframeRole', _IframeRole["default"]], ['IgnoredRole', _IgnoredRole["default"]], ['ImageMapLinkRole', _ImageMapLinkRole["default"]], ['ImageMapRole', _ImageMapRole["default"]], ['ImageRole', _ImageRole["default"]], ['InlineTextBoxRole', _InlineTextBoxRole["default"]], ['InputTimeRole', _InputTimeRole["default"]], ['LabelRole', _LabelRole["default"]], ['LegendRole', _LegendRole["default"]], ['LineBreakRole', _LineBreakRole["default"]], ['LinkRole', _LinkRole["default"]], ['ListBoxOptionRole', _ListBoxOptionRole["default"]], ['ListBoxRole', _ListBoxRole["default"]], ['ListItemRole', _ListItemRole["default"]], ['ListMarkerRole', _ListMarkerRole["default"]], ['ListRole', _ListRole["default"]], ['LogRole', _LogRole["default"]], ['MainRole', _MainRole["default"]], ['MarkRole', _MarkRole["default"]], ['MarqueeRole', _MarqueeRole["default"]], ['MathRole', _MathRole["default"]], ['MenuBarRole', _MenuBarRole["default"]], ['MenuButtonRole', _MenuButtonRole["default"]], ['MenuItemRole', _MenuItemRole["default"]], ['MenuItemCheckBoxRole', _MenuItemCheckBoxRole["default"]], ['MenuItemRadioRole', _MenuItemRadioRole["default"]], ['MenuListOptionRole', _MenuListOptionRole["default"]], ['MenuListPopupRole', _MenuListPopupRole["default"]], ['MenuRole', _MenuRole["default"]], ['MeterRole', _MeterRole["default"]], ['NavigationRole', _NavigationRole["default"]], ['NoneRole', _NoneRole["default"]], ['NoteRole', _NoteRole["default"]], ['OutlineRole', _OutlineRole["default"]], ['ParagraphRole', _ParagraphRole["default"]], ['PopUpButtonRole', _PopUpButtonRole["default"]], ['PreRole', _PreRole["default"]], ['PresentationalRole', _PresentationalRole["default"]], ['ProgressIndicatorRole', _ProgressIndicatorRole["default"]], ['RadioButtonRole', _RadioButtonRole["default"]], ['RadioGroupRole', _RadioGroupRole["default"]], ['RegionRole', _RegionRole["default"]], ['RootWebAreaRole', _RootWebAreaRole["default"]], ['RowHeaderRole', _RowHeaderRole["default"]], ['RowRole', _RowRole["default"]], ['RubyRole', _RubyRole["default"]], ['RulerRole', _RulerRole["default"]], ['ScrollAreaRole', _ScrollAreaRole["default"]], ['ScrollBarRole', _ScrollBarRole["default"]], ['SeamlessWebAreaRole', _SeamlessWebAreaRole["default"]], ['SearchRole', _SearchRole["default"]], ['SearchBoxRole', _SearchBoxRole["default"]], ['SliderRole', _SliderRole["default"]], ['SliderThumbRole', _SliderThumbRole["default"]], ['SpinButtonRole', _SpinButtonRole["default"]], ['SpinButtonPartRole', _SpinButtonPartRole["default"]], ['SplitterRole', _SplitterRole["default"]], ['StaticTextRole', _StaticTextRole["default"]], ['StatusRole', _StatusRole["default"]], ['SVGRootRole', _SVGRootRole["default"]], ['SwitchRole', _SwitchRole["default"]], ['TabGroupRole', _TabGroupRole["default"]], ['TabRole', _TabRole["default"]], ['TableHeaderContainerRole', _TableHeaderContainerRole["default"]], ['TableRole', _TableRole["default"]], ['TabListRole', _TabListRole["default"]], ['TabPanelRole', _TabPanelRole["default"]], ['TermRole', _TermRole["default"]], ['TextFieldRole', _TextFieldRole["default"]], ['TimeRole', _TimeRole["default"]], ['TimerRole', _TimerRole["default"]], ['ToggleButtonRole', _ToggleButtonRole["default"]], ['ToolbarRole', _ToolbarRole["default"]], ['TreeRole', _TreeRole["default"]], ['TreeGridRole', _TreeGridRole["default"]], ['TreeItemRole', _TreeItemRole["default"]], ['UserInterfaceTooltipRole', _UserInterfaceTooltipRole["default"]], ['VideoRole', _VideoRole["default"]], ['WebAreaRole', _WebAreaRole["default"]], ['WindowRole', _WindowRole["default"]]]);
var _default = AXObjectsMap;
exports["default"] = _default;
});

var AXObjectElementMap_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _AXObjectsMap = _interopRequireDefault(AXObjectsMap_1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var AXObjectElementMap = new Map([]);
var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
  var _loop = function _loop() {
    var _step$value = _slicedToArray(_step.value, 2),
        name = _step$value[0],
        def = _step$value[1];

    var relatedConcepts = def.relatedConcepts;

    if (Array.isArray(relatedConcepts)) {
      relatedConcepts.forEach(function (relation) {
        if (relation.module === 'HTML') {
          var concept = relation.concept;

          if (concept) {
            var relationConcepts = AXObjectElementMap.get(name) || new Set([]);
            relationConcepts.add(concept);
            AXObjectElementMap.set(name, relationConcepts);
          }
        }
      });
    }
  };

  for (var _iterator = _AXObjectsMap["default"][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
    _loop();
  }
} catch (err) {
  _didIteratorError = true;
  _iteratorError = err;
} finally {
  try {
    if (!_iteratorNormalCompletion && _iterator["return"] != null) {
      _iterator["return"]();
    }
  } finally {
    if (_didIteratorError) {
      throw _iteratorError;
    }
  }
}

var _default = AXObjectElementMap;
exports["default"] = _default;
});

var AXObjectRoleMap_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _AXObjectsMap = _interopRequireDefault(AXObjectsMap_1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

var AXObjectRoleMap = new Map([]);
var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
  var _loop = function _loop() {
    var _step$value = _slicedToArray(_step.value, 2),
        name = _step$value[0],
        def = _step$value[1];

    var relatedConcepts = def.relatedConcepts;

    if (Array.isArray(relatedConcepts)) {
      relatedConcepts.forEach(function (relation) {
        if (relation.module === 'ARIA') {
          var concept = relation.concept;

          if (concept) {
            var relationConcepts = AXObjectRoleMap.get(name) || new Set([]);
            relationConcepts.add(concept);
            AXObjectRoleMap.set(name, relationConcepts);
          }
        }
      });
    }
  };

  for (var _iterator = _AXObjectsMap["default"][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
    _loop();
  }
} catch (err) {
  _didIteratorError = true;
  _iteratorError = err;
} finally {
  try {
    if (!_iteratorNormalCompletion && _iterator["return"] != null) {
      _iterator["return"]();
    }
  } finally {
    if (_didIteratorError) {
      throw _iteratorError;
    }
  }
}

var _default = AXObjectRoleMap;
exports["default"] = _default;
});

var elementAXObjectMap_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _AXObjectsMap = _interopRequireDefault(AXObjectsMap_1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var axObjectNames = _toConsumableArray(_AXObjectsMap["default"].keys());

var elementAXObjectMap = new Map([]);
var _iteratorNormalCompletion = true;
var _didIteratorError = false;
var _iteratorError = undefined;

try {
  var _loop = function _loop() {
    var _step$value = _slicedToArray(_step.value, 2),
        name = _step$value[0],
        def = _step$value[1];

    var relatedConcepts = def.relatedConcepts;

    if (Array.isArray(relatedConcepts)) {
      relatedConcepts.forEach(function (relation) {
        if (relation.module === 'HTML') {
          var concept = relation.concept;

          if (concept) {
            var conceptStr = JSON.stringify(concept);
            var axObjects = (_toConsumableArray(elementAXObjectMap.entries()).find(function (_ref) {
              var _ref2 = _slicedToArray(_ref, 2),
                  key = _ref2[0],
                  value = _ref2[1];

              return JSON.stringify(key) === conceptStr;
            }) || [])[1];

            if (!axObjects) {
              axObjects = new Set([]);
            }

            axObjects.add(name);
            elementAXObjectMap.set(concept, axObjects);
          }
        }
      });
    }
  };

  for (var _iterator = _AXObjectsMap["default"][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
    _loop();
  }
} catch (err) {
  _didIteratorError = true;
  _iteratorError = err;
} finally {
  try {
    if (!_iteratorNormalCompletion && _iterator["return"] != null) {
      _iterator["return"]();
    }
  } finally {
    if (_didIteratorError) {
      throw _iteratorError;
    }
  }
}

var _default = elementAXObjectMap;
exports["default"] = _default;
});

var lib = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.elementAXObjects = exports.AXObjects = exports.AXObjectRoles = exports.AXObjectElements = void 0;

var _AXObjectElementMap = _interopRequireDefault(AXObjectElementMap_1);

var _AXObjectRoleMap = _interopRequireDefault(AXObjectRoleMap_1);

var _AXObjectsMap = _interopRequireDefault(AXObjectsMap_1);

var _elementAXObjectMap = _interopRequireDefault(elementAXObjectMap_1);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var AXObjectElements = _AXObjectElementMap["default"];
exports.AXObjectElements = AXObjectElements;
var AXObjectRoles = _AXObjectRoleMap["default"];
exports.AXObjectRoles = AXObjectRoles;
var AXObjects = _AXObjectsMap["default"];
exports.AXObjects = AXObjects;
var elementAXObjects = _elementAXObjectMap["default"];
exports.elementAXObjects = elementAXObjects;
});
