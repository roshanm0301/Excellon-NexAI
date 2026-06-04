import { Dom } from '../core/dom';
import { createDesignerContextStub } from '../test-tools/stubs';
import { ControlBarView } from './control-bar-view';

describe('ControlBarView', () => {
	it('creates view', () => {
		const parent = Dom.element('div');
		const context = createDesignerContextStub();
		const component = ControlBarView.create(parent, true, context.state);

		expect(component).toBeDefined();
		expect(parent.children.length).not.toEqual(0);
	});
});
