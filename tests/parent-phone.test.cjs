'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {samePhone}=require('../firebase/parent-phone.js');
test('Gabon local and E.164 formats match',()=>{assert.equal(samePhone('+241 77 304 389','077304389'),true);assert.equal(samePhone('+241 77 304 389','77304389'),true)});
test('Canadian E.164 and national formats match',()=>{assert.equal(samePhone('+1 604 555 1234','6045551234'),true)});
test('different countries do not match on suffix alone',()=>{assert.equal(samePhone('+1 604 555 1234','+241 04 555 1234'),false);assert.equal(samePhone('+1 604 555 1234','0775551234'),false)});
test('empty numbers never match',()=>{assert.equal(samePhone('',''),false)});
