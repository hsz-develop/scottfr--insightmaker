
Ext.chart.series.Series.prototype.coordinateStacked =  function(direction, directionOffset, directionCount) {
    var me = this,
        store = me.getStore(),
        items = store.queryBy(function(x) {//SFR
				return true;
			}).items,
        axis = me['get' + direction + 'Axis'](),
        hidden = me.getHidden(),
        range = {min: 0, max: 0},
        directions = me['fieldCategory' + direction],
        fieldCategoriesItem,
        i, j, k, fields, field, data, style = {},
        dataStart = [], dataEnd, posDataStart = [], negDataStart = [],
        stacked = me.getStacked(),
        sprites = me.getSprites();

    if (sprites.length > 0) {
        for (i = 0; i < directions.length; i++) {
            fieldCategoriesItem = directions[i];
            fields = me.getFields([fieldCategoriesItem]);
            for (j = 0; j < items.length; j++) {
                dataStart[j] = 0;
                posDataStart[j] = 0;
                negDataStart[j] = 0;
            }
            for (j = 0; j < fields.length; j++) {
                style = {};
                field = fields[j];
                if (hidden[j]) {
                    style['dataStart' + fieldCategoriesItem] = dataStart;
                    style['data' + fieldCategoriesItem] = dataStart;
                    sprites[j].setAttributes(style);
                    continue;
                }
                data = me.coordinateData(items, field, axis);
                if (stacked) {
                    dataEnd = [];
                    for (k = 0; k < items.length; k++) {
                        if (!data[k]) {
                            data[k] = 0;
                        }
                        if (data[k] >= 0) {
                            dataStart[k] = posDataStart[k];
                            posDataStart[k] += data[k];
                            dataEnd[k] = posDataStart[k];
                        } else {
                            dataStart[k] = negDataStart[k];
                            negDataStart[k] += data[k];
                            dataEnd[k] = negDataStart[k];
                        }
                    }
                    style['dataStart' + fieldCategoriesItem] = dataStart;
                    style['data' + fieldCategoriesItem] = dataEnd;
                    me.getRangeOfData(dataStart, range);
                    me.getRangeOfData(dataEnd, range);
                } else {
                    style['dataStart' + fieldCategoriesItem] = dataStart;
                    style['data' + fieldCategoriesItem] = data;
                    me.getRangeOfData(data, range);
                }
                sprites[j].setAttributes(style);
            }
        }
        me.dataRange[directionOffset] = range.min;
        me.dataRange[directionOffset + directionCount] = range.max;
        style = {};
        style['dataMin' + direction] = range.min;
        style['dataMax' + direction] = range.max;
        for (i = 0; i < sprites.length; i++) {
            sprites[i].setAttributes(style);
        }
    }
};

Ext.chart.series.Series.prototype.coordinate = function (direction, directionOffset, directionCount) {
    var me = this,
        store = me.getStore(),
        hidden = me.getHidden(),
        items = store.queryBy(function(x) {//SFR
				return true;
			}).items,
    // TODO: in this.processData we check if we have the getX(Y)Axis method,
    // TODO: if we don't, we call coordinateX(Y) instead, which calls this method,
    // TODO: but here we just call getX(Y)Axis even though it doesn't exist
    // TODO: (check cartesian charts without axes)
        axis = me['get' + direction + 'Axis'](),
        range = {min: Infinity, max: -Infinity},
        fieldCategory = me['fieldCategory' + direction] || [direction],
        fields = me.getFields(fieldCategory),
        i, field, data, style = {},
        sprites = me.getSprites();
    if (sprites.length > 0) {
        if (!Ext.isBoolean(hidden) || !hidden) {
            for (i = 0; i < fieldCategory.length; i++) {
                field = fields[i];
                data = me.coordinateData(items, field, axis);
                me.getRangeOfData(data, range);
                style['data' + fieldCategory[i]] = me.coordinateData(store.getData().items, field, axis); // SFR
            }
        }
        me.dataRange[directionOffset] = range.min;
        me.dataRange[directionOffset + directionCount] = range.max;
        style['dataMin' + direction] = range.min;
        style['dataMax' + direction] = range.max;
        if (axis) {
            axis.range = null;
            style['range' + direction] = axis.getRange();
        }
        for (i = 0; i < sprites.length; i++) {
            sprites[i].setAttributes(style);
        }
    }
};

    function getCustomColor(onSuccess){
        var colorPickerWindow = Ext.create({
                xtype: 'window',
                referenceHolder: true,
                minWidth: 540,
                minHeight: 200,
                layout: 'fit',
                header: false,
                resizable: true,
				modal: true,
                items: {
                    xtype: 'colorselector',
                    reference: 'selector',
                    showPreviousColor: false,
                    showOkCancelButtons: true,
					listeners: {
						ok: function(m, color){
							onSuccess(color);
							colorPickerWindow.close();
						}
						,cancel: function(){colorPickerWindow.close()}
					}
                }
            });
        var colorPicker = colorPickerWindow.lookupReference('selector');
        colorPicker.setFormat("#hex6");
        colorPicker.setColor("#0000ff");
		
		colorPicker.lookupReference('alphaSlider').up().setHidden(true);
        
        colorPickerWindow.show();
    }
	
	
	//EXTJS-16166 - Unable to use home/end/arrow navigation keys inside data views & grid editors.
	Ext.define('Ext.patch,EXTJS16166', {
	    override: 'Ext.view.View',
	    compatibility: '5.1.0.107',
	    handleEvent: function(e) {
	        var me = this,
	            isKeyEvent = me.keyEventRe.test(e.type),
	            nm = me.getNavigationModel();

	        e.view = me;
        
	        if (isKeyEvent) {
	            e.item = nm.getItem();
	            e.record = nm.getRecord();
	        }

	        // If the key event was fired programatically, it will not have triggered the focus
	        // so the NavigationModel will not have this information.
	        if (!e.item) {
	            e.item = e.getTarget(me.itemSelector);
	        }
	        if (e.item && !e.record) {
	            e.record = me.getRecord(e.item);
	        }

	        if (me.processUIEvent(e) !== false) {
	            me.processSpecialEvent(e);
	        }
        
	        // We need to prevent default action on navigation keys
	        // that can cause View element scroll unless the event is from an input field.
	        // We MUST prevent browser's default action on SPACE which is to focus the event's target element.
	        // Focusing causes the browser to attempt to scroll the element into view.
        
	        if (isKeyEvent && !Ext.fly(e.target).isInputField()) {
	            if (e.getKey() === e.SPACE || e.isNavKeyPress(true)) {
	                e.preventDefault();
	            }
	        }
	    }
	});
	
	
	//https://ftp.sencha.com/forum/showthread.php?297259-layout-causes-panel-to-reset-scroll-position-when-editing-form&p=1085534&viewfull=1&langid=14
	Ext.define('ScrollPreservingVbox', {


	    extend: 'Ext.layout.container.VBox',
	    alias: 'layout.scrollpreservingvbox',


	    completeLayout: function () {
	        this.callParent(arguments);
	        var ownerContext = arguments[0],
	            scrollable = ownerContext.ownerScrollable;


	        //This puts us back where we were prior to the refresh,
	        scrollable.scrollTo(ownerContext.scrollRestore.x, ownerContext.scrollRestore.y, false);
	    }




	});