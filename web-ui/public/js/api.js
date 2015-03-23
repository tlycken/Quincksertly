(function($) {

    window.api = {
        labels: labels,
        nodes: nodes,
        relations: relations,

        cache: {},

        buildQuery: buildQuery,
        submit: submit
    };

    function labels() {
        if (!this.cache.labels) {
            this.cache.labels = $.getJSON('//localhost:7474/db/data/labels').then(function (labels) {
                return _.sortBy(labels);
            });
        }
        return this.cache.labels;
    };

    function nodes() {
        if (!this.cache.nodes) {
            // Need to get nodes through the CYPHER api to get all of them in one request
            this.cache.nodes = $.ajax({
                type: 'POST',
                url: 'http://localhost:7474/db/data/transaction/commit',
                data: JSON.stringify({ statements: [{ statement: "MATCH (n) RETURN n, id(n), labels(n)" }] }),
                contentType: 'application/json'
            }).then(function (data) {
                // The Cypher query gives results in an inconvenient form - re-map to something more useful
                return _.map(data.results[0].data, function (o) {
                    var res = o.row[0]; // the node object
                    res.id = o.row[1];
                    res.labels = o.row[2];
                    return res;
                });
            });
        }
        this.cache.nodes.then(function(nodes) {
            _.forEach(nodes, function(n) {
                //console.log('id: ' + n.id + ', name: ' + n.name + ', Role: ' + n.Role + ', labels: [' + n.labels.join() + ']');
            });
        });
        return this.cache.nodes;
    };

    function relations() {
        if (!this.cache.relationtypes) {
            this.cache.relationtypes = $.getJSON('//localhost:7474/db/data/relationship/types').then(function(results) {
                return _.map(results, function (result) {
                    return { name: result };
                })
            });
        }
        return this.cache.relationtypes;
    };

    function buildQuery(chain) {
        // Loop through nodes and either match or create them, depending on id
        _.forEach(_.filter(chain, _.isObject), function(node, idx) {
            node.varname = 'n' + idx;
            if (node.id !== -1) {
                node.where = 'id(' + node.varname + ') = ' + node.id;
            } else if (node.id && node.id == -1) {
                node.create = '(' + node.varname;
                if (_.any(node.labels)) {
                    node.create += ':' + node.labels.join(':')
                }
                node.create += ' { name: \'' + node.name + '\'})';
            }
        });
        _.forEach(_.filter(chain, _.isString), function(rel, idx) {
            rel.varname = 'r' + idx;
        });

        var matches = _.chain(chain).filter(function(link) { 
            return _.isObject(link) && link.hasOwnProperty('where'); 
        }).map(function(node) {
            return node.varname;
        }).value();
        var wheres = _.chain(chain).filter(function(link) {
            return _.isObject(link) && link.hasOwnProperty('where');
        }).map(function(node) {
            return node.where;
        }).value();
        var creates = _.chain(chain).filter(function(link) {
            return _.isObject(link) && link.hasOwnProperty('create');
        }).map(function(node) {
            return node.create;
        }).value();

        var matchClause = _.any(matches) ? 'MATCH ' + matches.join() + ' WHERE ' + wheres.join(' AND ') : '',
            createClause = _.any(creates) ? ' CREATE ' + creates.join() : '';

        var mergeClause = '',
            relCount = 0;
        _.forEach(chain, function(link, idx) {
            if (_.isString(link)) {
                var n0 = chain[idx-1],
                    n1 = chain[idx+1],
                    r = link;
                mergeClause += ' MERGE (' + n0.varname + ')-[r' + relCount++ + ':' + r + ']-(' + n1.varname + ')';
            }
        });

        return matchClause + createClause + mergeClause;
    };

    function submit(query) {
        return $.ajax({
            type: 'POST',
            url: 'http://localhost:7474/db/data/transaction/commit',
            data: JSON.stringify({ statements: [{ statement: query }]}),
            contentType: 'application/json'
        }).then(function (data) {
            if (_.any(data.errors)) {
                console.log('Error', data.errors);
                throw new Error("An error occurred when trying to save data");
            }
        });
    }
})(jQuery);