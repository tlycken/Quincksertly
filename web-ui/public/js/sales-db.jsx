(function($, api) {

    RegExp.quote = function(str) { return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1"); };

    var Typeahead = React.createClass({
        propTypes: {
            onCreated: React.PropTypes.func.isRequired
        },
        getInitialState: function() {
            return this.props.selected
                ? { 
                    input: this.props.selected.name,
                    selected: this.props.selected,
                    showOpts: false
                } 
                : { 
                    input: '',
                    showOpts: false
                };
        },
        handleChange: function(evt) {
            this.replaceState({
                input: evt.target.value,
                showOpts: false
            });
            if (this.props.onUnselected) {
                this.props.onUnselected();
            }
        },
        handleSelect: function(o) {
            var newState = {
                input: o.name,
                selected: _.find(this.props.collection, function(i) { return (i.hasOwnProperty('id') && i.id == o.id) || i.name == o.name; })
            };
            this.setState(newState, function() {
                if (this.props.onSelected) {
                    this.props.onSelected(this.state.selected);
                }
            }.bind(this));
        },
        matches: function() {
            var specials = '',
                input = this.state.input,
                clean = RegExp.quote(input),
                regex = new RegExp(clean, 'i');
                return _.select(this.props.collection, function(e) {
                    return (e.name.match(regex) || (e.labels && e.labels.join().match(regex)));
                });
        },
        hasChoice: function() {
            return this.state.hasOwnProperty('selected');
        },
        showOpts: function () {
            this.setState({ showOpts: true });
        },
        shouldShowOpts: function() {
            return !this.hasChoice() && (this.state.input !== '' && _.any(this.matches()) || this.state.showOpts);
        },
        createNew: function() {
            this.props.onCreated(this.state.input);
        },
        render: function() {
            var name = this.props.name + '-' + this.props.lvl;
            return  <div className="form-group">
                        <label htmlFor={name}>{this.props.displayName}</label>
                        <input ref="field" className="form-control" name={name} onChange={this.handleChange} onFocus={this.showOpts} value={this.state.input} autoComplete="off" />
                        <input name={name + '-hidden'} type="hidden" value={this.state.selectedId} />
                        <TypeaheadOptions options={this.matches()} visible={this.shouldShowOpts()} onSelect={this.handleSelect} />
                        {!this.state.selected && this.state.input !== ''
                            ? <button className="btn btn-primary" onClick={this.createNew}>Skapa ny</button>
                            : false}
                    </div>;
        }
    });

    var TypeaheadOptions = React.createClass({
        onClick: function(id, text) {
            var obj = _.findWhere(this.props.options, { id: id });
            if (!obj) {
                obj = _.findWhere(this.props.options, { name: text });
            }
            this.props.onSelect(obj);
        },
        render: function() {
            return <div className="typeahead-options" style={{display: this.props.visible ? 'block' : 'none'}}>
                    <ul>{_.map(this.props.options, function(opt) {
                        var txt = opt.name;
                        if (opt.labels) {
                            txt += ' (' + opt.labels.join() + ')';
                        }
                        return <TypeaheadOption key={opt.id || opt.name} id={opt.id}
                                                onClick={this.onClick.bind(this, opt.id, opt.name)}
                                                text={txt} />;
                    }.bind(this))}</ul>
                   </div>;
        }
    });

    var TypeaheadOption = React.createClass({
        onClick: function() { 
            this.props.onClick(this.props.id, this.props.name);
        },
        render: function() {
                return <li><button className="btn btn-default" onClick={this.onClick}>{this.props.text}</button></li>;
            }
        });

    var NodeChoice = React.createClass({
        propTypes: {
            displayName: React.PropTypes.string.isRequired,
            nodes: React.PropTypes.array.isRequired,
            labels: React.PropTypes.array.isRequired,
            selectedId: React.PropTypes.number,
            onNodeSelected: React.PropTypes.func,
            onNodeDeselected: React.PropTypes.func,
            onNewNodeCreated: React.PropTypes.func.isRequired,
            lvl: React.PropTypes.number.isRequired
        },
        getInitialState: function () {
            return { 
                node: _.findWhere(this.props.nodes, { id: this.props.selectedId }) || null,
            };
        },
        onNodeSelected: function (node) {
            this.setState({ node: node }, function() {
                if (this.props.onNodeSelected) {
                    this.props.onNodeSelected(node);
                }
            }.bind(this));
        },
        onNodeCreated: function (name) {
            var newNode = {
                name: name,
                labels: [],
                id: -1
            }
            this.onNodeSelected(newNode);
        },
        onUnselected: function () {
            this.replaceState({});
            if (this.props.onNodeDeselected) { this.props.onNodeDeselected(); }
        },
        onLabelsSelected: function(labels) {
            if (this.state.node) {
                this.state.node.labels = labels;
            }
        },
        render: function () {
            var labelChoice = this.state.node 
                                ? <LabelChoice displayName="Välj etiketter"
                                    labels={this.props.labels}
                                    selected={this.state.node.labels}
                                    onLabelsSelected={this.onLabelsSelected} />
                                : false;
            return <div className="row">
                        <div className="col-xs-6">
                            <Typeahead name="node"
                                lvl={this.props.lvl}
                                displayName={this.props.displayName}
                                collection={this.props.nodes}
                                selected={this.state.node}
                                onSelected={this.onNodeSelected}
                                onUnselected={this.onUnselected}
                                onCreated={this.onNodeCreated} />
                        </div>
                        <div className="col-xs-6">
                            {labelChoice}
                        </div>
                    </div>;
        }
    });

    var LabelChoice = React.createClass({
        propTypes: {
            labels: React.PropTypes.array.isRequired,
            selected: React.PropTypes.array.isRequired,
            onLabelsSelected: React.PropTypes.func.isRequired
        },
        getInitialState: function() {
            return { selected: this.props.selected };
        },
        changeLabel: function(lbl) {
            var callback = function() { this.props.onLabelsSelected(this.state.selected); };
            if (_.includes(this.state.selected, lbl)) {
                this.setState({ selected: _.without(this.state.selected, lbl) }, callback);
            } else {
                this.setState({ selected: this.state.selected.concat([lbl]) }, callback);
            }
        },
        render: function() {
            return <div>
                        <label>Etiketter</label>
                            {_.map(this.props.labels, function(lbl) {
                                return <div key={lbl} className="input-group">
                                            <span className="input-group-addon">
                                                <input  type="checkbox"
                                                        autoComplete="off"
                                                        checked={_.includes(this.state.selected, lbl)}
                                                        onChange={this.changeLabel.bind(this, lbl)}></input>
                                            </span>
                                            <input className="form-control" type="text" value={lbl} disabled={true} />
                                        </div>;
                            }.bind(this))}
                    </div>;
        }
    })

    var RelationChoice = React.createClass({
        propTypes: {
            onRelationSelected: React.PropTypes.func,
            types: React.PropTypes.array.isRequired,
            lvl: React.PropTypes.string.isRequired,
            onRelationCreated: React.PropTypes.func.isRequired
        },

        onRelationSelected: function(r) {
            if (this.props.onRelationSelected) {
                this.props.onRelationSelected(r.name);
            }
        },
        onRelationCreated: function(r) {
            var newRel = { name: r };
            this.props.onRelationCreated(newRel);
            onRelationSelected(newRel);
        },
        render: function () {
            return  <div>
                        <Typeahead name="relation"
                                lvl={this.props.lvl}
                                displayName="med relation av typen"
                                collection={this.props.types}
                                onSelected={this.onRelationSelected}
                                onCreated={this.onRelationCreated} />
                    </div>;
        }
    });

    var Relation = React.createClass({
        propTypes: {
            onRelationSelected: React.PropTypes.func,
            types: React.PropTypes.array.isRequired,
            nodes: React.PropTypes.array.isRequired,
            labels: React.PropTypes.array.isRequired,
            persister: React.PropTypes.func.isRequired,
            createNode: React.PropTypes.func.isRequired,
            onRelationCreated: React.PropTypes.func.isRequired,
            startNode: React.PropTypes.object
        },

        getInitialState: function () {
            return {
                relationType: null,
                adding: false
            };
        },
        addRelation: function() {
            this.setState({ adding: true });
        },
        onRelationSelected: function(relationType) {
            this.setState({ relationType: relationType });
            if (this.props.onRelationSelected) {
                this.props.onRelationSelected(relationType);
            }
        },
        onRelationCreated: function(relationType) {
            this.props.onRelationCreated(relationType);
            this.onRelationSelected(relationType);
        },
        save: function() {
            this.persist([]);
        },
        persist: function(chain) {
            if (this.state.relationType) {
                chain.unshift(this.state.relationType);
            }
            this.props.persister(chain);
        },
        render: function() {
            //if (this.props.startNode && !this.state.adding) {
            return this.state.adding
                ?   <div>
                        <RelationChoice lvl={this.props.lvl} 
                                           types={this.props.types}
                                           onRelationSelected={this.onRelationSelected}
                                           onRelationCreated={this.onRelationCreated} />
                        <ChainLink nodes={this.props.nodes}
                                   types={this.props.types}
                                   labels={this.props.labels}
                                   createNode={this.props.createNode}
                                   lvl={parseInt(this.props.lvl.substr(0,1))+1}
                                   displayName="till"

                                   persister={this.persist} />
                    </div>
                :   this.props.startNode 
                    ?  <div>
                            <button className="btn btn-success pull-left" onClick={this.save}>Spara</button>
                            <button className="btn btn-primary pull-left" onClick={this.addRelation}>Lägg till relation</button>
                        </div>
                    : false;
        }
    });

    var ChainLink = React.createClass({
        propTypes: {
            nodes: React.PropTypes.array.isRequired,
            types: React.PropTypes.array.isRequired,
            labels: React.PropTypes.array.isRequired,
            lvl: React.PropTypes.number.isRequired,
            displayName: React.PropTypes.string,
            createNode: React.PropTypes.func.isRequired,
            createRelation: React.PropTypes.func.isRequired,
            persister: React.PropTypes.func.isRequired
        },
        getInitialState: function () {
            return {
                selectedNode: null,
                selectedRelation: null,
            };
        },
        selectNode: function(node) {
            this.setState({ selectedNode: node });
        },
        deselectNode: function () {
            this.setState({ selectedNode: null });
        },
        selectRelation: function(rel) {
            this.setState({ selectedRelation: rel });
        },
        createNode: function(node) {
            this.props.createNode(node);
        },
        createRelation: function(rel) {
            this.props.createRelation(rel);
        },
        persist: function(chain) {
            chain.unshift(this.state.selectedNode);
            this.props.persister(chain);
        },
        render: function () {
            return  <div>
                        <NodeChoice nodes={this.props.nodes}
                                    labels={this.props.labels}
                                    lvl={this.props.lvl}
                                    onNodeSelected={this.selectNode}
                                    onNodeDeselected={this.deselectNode}
                                    onNewNodeCreated={this.createNode}
                                    displayName={this.props.displayName || 'Välj eller skapa en nod'} />
                        <Relation   nodes={this.props.nodes}
                                    types={this.props.types}
                                    labels={this.props.labels}
                                    createNode={this.createNode}
                                    onRelationCreated={this.createRelation}
                                    lvl={this.props.lvl + '-' + (this.props.lvl+1)}
                                    startNode={this.state.selectedNode}
                                    persister={this.persist} />
                    </div>;
        }
    });

    var Log = React.createClass({
        propTypes: {
            entries: React.PropTypes.array.isRequired
        },
        render: function() {
            return <div>
                        {_.map(this.props.entries, function(entry) {
                            <p key={entry}>{entry}</p>
                        }.bind(this))}
                    </div>
        }
    });

    var Chain = React.createClass({
        getInitialState: function () {
           return {
                nodes: [],
                relations: [],
                labels: []
            };
        },
        componentDidMount: function () {
            api.relations().then(function(rels) {
                if (this.isMounted()) {
                    this.setState({ relations: rels }); 
                }
            }.bind(this));
            api.labels().then(function(lbls) {
                if (this.isMounted()) {
                    this.setState({ labels: lbls });
                }
            }.bind(this));
            api.nodes().then(function(nds) {
                if (this.isMounted()) {
                    this.setState({ nodes: nds });
                }
            }.bind(this));
        },

        onNodeSelected: function (node) {
            chain.push(node.id);
        },
        onRelationSelected: function (relationType) {
            chain.push(relationType);
        },
        createNode: function(node) {
            this.setState({
                nodes: this.state.nodes.concat([node])
            });
        },
        createRelation: function(rel) {
            this.setState({
                relations: this.state.relations.concat([rel])
            });
        },
        persist: function(chain) {
            var entry = $('<div>');
            for(var idx in chain){
                if (_.isObject(chain[idx])) {
                    entry.append('N:').append(chain[idx].name);
                    if(_.any(chain[idx].labels)){
                        entry.append(':').append(chain[idx].labels.join())
                    }
                }
                if (_.isString(chain[idx])) {
                    entry.append('R:').append(chain[idx]);
                }
                if (idx < chain.length - 1) {
                    entry.append("  --  ");
                }
            }
            $('.console').append(entry);
        },

        render: function() {
            return <div>
                        <ChainLink ref="firstLink"
                            nodes={this.state.nodes}
                            types={this.state.relations}
                            labels={this.state.labels}
                            persister={this.persist}
                            createNode={this.createNode}
                            createRelation={this.createRelation}
                            lvl={1} />
                    </div>;
        }
    });

    React.render(<Chain />, document.getElementById('content'));
})(jQuery, api);
