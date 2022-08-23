/**
 * DBSCAN - Density based clustering
 *
 * @author Lukasz Krawczyk <contact@lukaszkrawczyk.eu>
 * @copyright MIT
 * 
 * @examples
 * ```javascript
 * var dataset = [
 *  [1,1],[0,1],[1,0],
 *  [10,10],[10,13],[13,13],
 *  [54,54],[55,55],[89,89],[57,55]
 * ];
 * 
 * new DBSCAN().run(dataset, 5, 2);
 * 
 * console.log(clusters, dbscan.noise);
 * ```
 */
export class DBSCAN {
  /**
   * DBSCAN class construcotr
   * @constructor
   *
   * @param {Array} dataset
   * @param {number} epsilon
   * @param {number} minPts
   * @param {function} distanceFunction
   * @returns {DBSCAN}
   */
  constructor(dataset, epsilon, minPts, distanceFunction) {
    /** @type {Array} */
    this.dataset = [];
    /** @type {number} */
    this.epsilon = 1;
    /** @type {number} */
    this.minPts = 2;
    /** @type {function} */
    this.distance = this._euclideanDistance;
    /** @type {Array} */
    this.clusters = [];
    /** @type {Array} */
    this.noise = [];

    // temporary variables used during computation
    /** @type {Array} */
    this._visited = [];
    /** @type {Array} */
    this._assigned = [];
    /** @type {number} */
    this._datasetLength = 0;

    this._init(dataset, epsilon, minPts, distanceFunction);
  }
  /******************************************************************************/
  // public functions
  /**
   * Start clustering
   *
   * @param {Array} dataset
   * @param {number} epsilon
   * @param {number} minPts
   * @param {function} distanceFunction
   * @returns {undefined}
   * @access public
   */
  run(dataset, epsilon, minPts, distanceFunction) {
    this._init(dataset, epsilon, minPts, distanceFunction);

    for (var pointId = 0; pointId < this._datasetLength; pointId++) {
      // if point is not visited, check if it forms a cluster
      if (this._visited[pointId] !== 1) {
        this._visited[pointId] = 1;

        // if closest neighborhood is too small to form a cluster, mark as noise
        var neighbors = this._regionQuery(pointId);

        if (neighbors.length < this.minPts) {
          this.noise.push(pointId);
        } else {
          // create new cluster and add point
          var clusterId = this.clusters.length;
          this.clusters.push([]);
          this._addToCluster(pointId, clusterId);

          this._expandCluster(clusterId, neighbors);
        }
      }
    }

    return this.clusters;
  }
  /******************************************************************************/
  // protected functions
  /**
   * Set object properties
   *
   * @param {Array} dataset
   * @param {number} epsilon
   * @param {number} minPts
   * @param {function} distance
   * @returns {undefined}
   * @access protected
   */
  _init(dataset, epsilon, minPts, distance) {

    if (dataset) {

      if (!(dataset instanceof Array)) {
        throw Error('Dataset must be of type array, ' +
          typeof dataset + ' given');
      }

      this.dataset = dataset;
      this.clusters = [];
      this.noise = [];

      this._datasetLength = dataset.length;
      this._visited = new Array(this._datasetLength);
      this._assigned = new Array(this._datasetLength);
    }

    if (epsilon) {
      this.epsilon = epsilon;
    }

    if (minPts) {
      this.minPts = minPts;
    }

    if (distance) {
      this.distance = distance;
    }
  }
  /**
   * Expand cluster to closest points of given neighborhood
   *
   * @param {number} clusterId
   * @param {Array} neighbors
   * @returns {undefined}
   * @access protected
   */
  _expandCluster(clusterId, neighbors) {

    /**
     * It's very important to calculate length of neighbors array each time,
     * as the number of elements changes over time
     */
    for (var i = 0; i < neighbors.length; i++) {
      var pointId2 = neighbors[i];

      if (this._visited[pointId2] !== 1) {
        this._visited[pointId2] = 1;
        var neighbors2 = this._regionQuery(pointId2);

        if (neighbors2.length >= this.minPts) {
          neighbors = this._mergeArrays(neighbors, neighbors2);
        }
      }

      // add to cluster
      if (this._assigned[pointId2] !== 1) {
        this._addToCluster(pointId2, clusterId);
      }
    }
  }
  /**
   * Add new point to cluster
   *
   * @param {number} pointId
   * @param {number} clusterId
   */
  _addToCluster(pointId, clusterId) {
    this.clusters[clusterId].push(pointId);
    this._assigned[pointId] = 1;
  }
  /**
   * Find all neighbors around given point
   *
   * @param {number} pointId,
   * @param {number} epsilon
   * @returns {Array}
   * @access protected
   */
  _regionQuery(pointId) {
    var neighbors = [];

    for (var id = 0; id < this._datasetLength; id++) {
      var dist = this.distance(this.dataset[pointId], this.dataset[id]);
      if (dist < this.epsilon) {
        neighbors.push(id);
      }
    }

    return neighbors;
  }
  /******************************************************************************/
  // helpers
  /**
   * @param {Array} a
   * @param {Array} b
   * @returns {Array}
   * @access protected
   */
  _mergeArrays(a, b) {
    var len = b.length;

    for (var i = 0; i < len; i++) {
      var P = b[i];
      if (a.indexOf(P) < 0) {
        a.push(P);
      }
    }

    return a;
  }
  /**
   * Calculate euclidean distance in multidimensional space
   *
   * @param {Array} p
   * @param {Array} q
   * @returns {number}
   * @access protected
   */
  _euclideanDistance(p, q) {
    var sum = 0;
    var i = Math.min(p.length, q.length);

    while (i--) {
      sum += (p[i] - q[i]) * (p[i] - q[i]);
    }

    return Math.sqrt(sum);
  }
};