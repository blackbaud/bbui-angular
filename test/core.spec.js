/*jshint browser: true, jasmine: true */
/*global module, inject */

describe('core', function () {
    'use strict';

    var bbui,
        $window;

    beforeEach(module(
        'bbui.core'
    ));

    beforeEach(inject(function (_bbui_, _$window_) {
        bbui = _bbui_;
        $window = _$window_;
    }));

    describe('bbui', function () {

        describe("emptyGuid", function () {

            it("is the expected value", function () {
                expect(bbui.emptyGuid).toBe("00000000-0000-0000-0000-000000000000");
            });

        });

        describe("is", function () {

            it("returns false for expected values", function () {
                expect(bbui.is(null)).toBe(false);
                expect(bbui.is()).toBe(false);
                expect(bbui.is(undefined)).toBe(false);
            });

            it("returns true for expected values", function () {
                expect(bbui.is(false)).toBe(true);
                expect(bbui.is("")).toBe(true);
                expect(bbui.is({})).toBe(true);
            });

        });

        describe("findByProp", function () {

            it("does not fail when missing arguments", function () {
                expect(bbui.findByProp()).toBe(null);
            });

            it("finds the property", function () {

                var items;

                items = [
                    {
                        name: "aardvark"
                    },
                    {
                        name: "beetle"
                    },
                    {
                        name: "cat"
                    }
                ];

                expect(bbui.findByProp(items, "name", "beetle")).toBe(items[1]);

            });

            it("does not error when the property does not exist", function () {

                var items;

                items = [
                    {
                        name: "aardvark"
                    },
                    {
                        name: "beetle"
                    },
                    {
                        name: "cat"
                    }
                ];

                expect(bbui.findByProp(items, "id", "beetle")).toBe(null);

            });

            it("does not error when the item is not found", function () {

                var items;

                items = [
                    {
                        name: "aardvark"
                    },
                    {
                        name: "beetle"
                    },
                    {
                        name: "cat"
                    }
                ];

                expect(bbui.findByProp(items, "name", "dog")).toBe(null);

            });

            it("property is case sensitive", function () {

                var items;

                items = [
                    {
                        name: "aardvark"
                    },
                    {
                        name: "beetle"
                    },
                    {
                        name: "cat"
                    }
                ];

                expect(bbui.findByProp(items, "Name", "beetle")).toBe(null);

            });

            it("value is case sensitive", function () {

                var items;

                items = [
                    {
                        name: "aardvark"
                    },
                    {
                        name: "beetle"
                    },
                    {
                        name: "cat"
                    }
                ];

                expect(bbui.findByProp(items, "name", "Beetle")).toBe(null);

            });

            it("property case sensitivity can be ignored", function () {

                var items;

                items = [
                    {
                        name: "aardvark"
                    },
                    {
                        name: "beetle"
                    },
                    {
                        name: "cat"
                    }
                ];

                expect(bbui.findByProp(items, "Name", "beetle", true)).toBe(items[1]);

            });

            it("value case sensitivity can be ignored", function () {

                var items;

                items = [
                    {
                        name: "aardvark"
                    },
                    {
                        name: "beetle"
                    },
                    {
                        name: "cat"
                    }
                ];

                expect(bbui.findByProp(items, "name", "Beetle", false, true)).toBe(items[1]);

            });

        });

        describe("getPropValue", function () {

            it("gets the property value", function () {

                var item = {
                    name: "beetle"
                };

                expect(bbui.getPropValue(item, "name")).toBe("beetle");

            });

            it("returns null when the property is not found", function () {

                var item = {
                    name: "beetle"
                };

                expect(bbui.getPropValue(item, "id")).not.toBeDefined();

            });

            it("returns default when the property is not found", function () {

                var item = {
                    name: "beetle"
                };

                expect(bbui.getPropValue(item, "id", false, "1")).toBe("1");

            });

            it("is case sensitive", function () {

                var item = {
                    name: "beetle"
                };

                expect(bbui.getPropValue(item, "Name")).not.toBeDefined();

            });

            it("ignores case sensitivity when set", function () {

                var item = {
                    name: "beetle"
                };

                expect(bbui.getPropValue(item, "Name", true)).toBe("beetle");

            });

        });

        describe("clone", function () {

            it("returns a clone", function () {

                var item,
                    result;

                item = {
                    name: "Paul McCartney",
                    type: "Beatle",
                    wives: [
                        {
                            name: "Nancy Shevell"
                        },
                        {
                            name: "Heather Mills"
                        },
                        {
                            name: "Linda McCartney"
                        }
                    ]
                };

                result = bbui.clone(item);

                expect(result).not.toBe(item);
                expect(JSON.stringify(result)).toBe(JSON.stringify(item));

            });

            it("does not error on undefined", function () {
                expect(bbui.clone()).not.toBeDefined();
            });

            it("does not error on null", function () {
                expect(bbui.clone(null)).toBe(null);
            });

        });

        describe("copyProps", function () {

            it("copies properties", function () {

                var to = {
                        name: "aardvark",
                        type: "mammal"
                    },
                    from = {
                        name: "beetle",
                        id: "1"
                    };

                bbui.copyProps(to, from);

                expect(to.name).toBe("beetle");
                expect(to.id).toBe("1");
                expect(to.type).toBe("mammal");

            });

        });

        describe("guidEquals", function () {

            it("returns expected values", function () {

                var guid1 = "d18afb17-13f6-4e12-a3d4-126443fb07e5",
                    guid1Upper = "D18AFB17-13F6-4E12-A3D4-126443FB07E5",
                    guid2 = "8149a697-e259-48fe-80b8-3d410b6fd1f6",
                    guid2Upper = "8149A697-E259-48FE-80B8-3D410B6FD1F6";

                expect(bbui.guidEquals(guid1, guid1)).toBe(true);
                expect(bbui.guidEquals(guid1, guid1Upper)).toBe(true);
                expect(bbui.guidEquals(guid1Upper, guid1)).toBe(true);
                expect(bbui.guidEquals(guid2, guid2)).toBe(true);
                expect(bbui.guidEquals(guid2, guid2Upper)).toBe(true);
                expect(bbui.guidEquals(guid2Upper, guid2)).toBe(true);

                expect(bbui.guidEquals(guid1, guid2)).toBe(false);
                expect(bbui.guidEquals(guid2, guid1)).toBe(false);

            });

            it("works with non-guids", function () {

                var guid1 = "d18afb17-13f6-4e12-a3d4-126443fb07e5",
                    nonGuid = "this is not a guid",
                    nonString = 5;

                expect(bbui.guidEquals(guid1, nonGuid)).toBe(false);
                expect(bbui.guidEquals(guid1, nonString)).toBe(false);

            });

            it("works with upper case parameters", function () {

                var guid1 = "d18afb17-13f6-4e12-a3d4-126443fb07e5",
                    guid1Upper = "D18AFB17-13F6-4E12-A3D4-126443FB07E5",
                    guid2 = "8149a697-e259-48fe-80b8-3d410b6fd1f6",
                    guid2Upper = "8149A697-E259-48FE-80B8-3D410B6FD1F6";

                expect(bbui.guidEquals(guid1, guid1Upper, false, true)).toBe(true);
                expect(bbui.guidEquals(guid1, guid1Upper, true, false)).toBe(false);
                expect(bbui.guidEquals(guid1Upper, guid1, true, false)).toBe(true);
                expect(bbui.guidEquals(guid1Upper, guid1, false, true)).toBe(false);

                expect(bbui.guidEquals(guid2, guid2Upper, false, true)).toBe(true);
                expect(bbui.guidEquals(guid2, guid2Upper, true, false)).toBe(false);
                expect(bbui.guidEquals(guid2Upper, guid2, true, false)).toBe(true);
                expect(bbui.guidEquals(guid2Upper, guid2, false, true)).toBe(false);

            });

        });

        describe("getObjByName", function () {

            var obj = {name: "Paul McCartney"};

            beforeEach(function () {
                $window.BBUI = {
                    globals: {
                        myFunction: obj
                    }
                };
            });

            it("should get the object", function () {
                expect(bbui.getObjByName("BBUI.globals.myFunction")).toBe(obj);
            });

            it("should not fail when object name is not found", function () {
                expect(bbui.getObjByName("Something.globals.myFunction")).toBe(null);
                expect(bbui.getObjByName("BBUI.something.myFunction")).toBe(null);
                expect(bbui.getObjByName("BBUI.globals.something")).toBe(null);
                expect(bbui.getObjByName("BBUI.globals.myFunction.something")).toBe(null);
                expect(bbui.getObjByName("BBUI.globals.myFunction.something.something")).toBe(null);
            });

        });

    });
});
