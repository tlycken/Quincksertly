(function($) {

    window.api = {
        labels: labels,
        nodes: nodes,
        relations: relations,

        cache: {}
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
})(jQuery);