$(document).ready(function() {
    // Load all goals when the page is ready
    loadGoals();

    // Toggle Graph View visibility
    $('#toggle-graph-button').on('click', function() {
        if ($('#graph-analysis').is(':visible')) {
            // Switch to Goals View
            $('#graph-analysis').hide();
            $('#goals-overview').show();
            $('#goal-history').hide();
            $('#toggle-graph-button').text('Show Graph View');
        } else {
            // Switch to Graph View
            $('#goals-overview').hide();
            $('#goal-history').hide();
            $('#graph-analysis').show();
            $('#toggle-graph-button').text('Show Goals View');
            loadScoreTrend();  // Load and display the graph data
        }
    });

    // Load goals and display in table
    function loadGoals() {
        $.ajax({
            url: '/goals',
            method: 'GET',
            success: function(goals) {
                $('#goals-list').empty();
                goals.forEach(goal => {
                    $('#goals-list').append(`
                        <tr>
                            <td>${goal.abteilung_id}</td>
                            <td>${goal.aussage}</td>
                            <td>${goal.kriterien}</td>
                            <td>${goal.bewertung}</td>
                            <td>${goal.einschaetzung}</td>
                            <td>${goal.letzte_aenderung}</td>
                            <td>${goal.geaendert_von}</td>
                            <td>${goal.kommentar}</td>
                            <td>
                                <button onclick="viewHistory(${goal.id})">History</button>
                                <button onclick="editGoal(${goal.id})">Edit</button>
                            </td>
                        </tr>
                    `);
                });
            },
            error: function(xhr, status, error) {
                console.error("Error loading goals:", xhr.responseText);
            }
        });
    }

    // Function to view the history of a specific goal with detailed formatting
    window.viewHistory = function(goalId) {
        $('#goals-overview').hide();
        $('#goal-history').show();
        $('#graph-analysis').hide();

        $.ajax({
            url: `/goals/${goalId}/history`,
            method: 'GET',
            success: function(history) {
                $('#history-list').empty();
                history.forEach(entry => {
                    $('#history-list').append(`
                        <tr>
                            <td>${entry.aenderung_datum}</td>
                            <td>${entry.bewertung}</td>
                            <td>${entry.kommentar}</td>
                            <td>${entry.geaendert_von}</td>
                        </tr>
                    `);
                });
            },
            error: function(xhr, status, error) {
                console.error("Error loading history:", xhr.responseText);
            }
        });
    }

    // Add goal button handler
    $('#add-goal-button').on('click', function() {
        const aussage = prompt("Enter goal statement:");
        const abteilung_id = prompt("Enter department ID (must match existing department ID):");
        const bewertung = prompt("Enter rating (1-10):");
        const kriterien = prompt("Enter criteria for success:");

        $.ajax({
            url: '/goals',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                aussage: aussage,
                abteilung_id: parseInt(abteilung_id),
                bewertung: parseInt(bewertung),
                kriterien: kriterien
            }),
            success: function() {
                loadGoals();
                alert("Goal added successfully!");
            },
            error: function(xhr, status, error) {
                console.error("Error adding goal:", xhr.responseText);
            }
        });
    });

    // Edit goal function
    window.editGoal = function(goalId) {
        const aussage = prompt("Enter updated goal statement:");
        const kriterien = prompt("Enter updated criteria:");
        const bewertung = prompt("Enter updated rating (1-10):");
        const einschaetzung = prompt("Enter updated assessment:");
        const kommentar = prompt("Enter updated comments:");

        $.ajax({
            url: `/goals/${goalId}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({
                aussage: aussage,
                kriterien: kriterien,
                bewertung: parseInt(bewertung),
                einschaetzung: einschaetzung,
                kommentar: kommentar,
                letzte_aenderung: new Date().toISOString().split('T')[0],
                geaendert_von: "User"  // Replace "User" with the actual username if available
            }),
            success: function() {
                loadGoals();
                alert("Goal updated successfully!");
            },
            error: function(xhr, status, error) {
                console.error("Error updating goal:", xhr.responseText);
            }
        });
    };

    // Back button to return to the goals overview
    $('#back-to-overview').on('click', function() {
        $('#goal-history').hide();
        $('#goals-overview').show();
    });

    // Load the score trend and display it on the graph
    function loadScoreTrend() {
        $.ajax({
            url: '/average_scores',
            method: 'GET',
            success: function(data) {
                const labels = data.map(item => item.date);  // X-axis labels (dates)
                const scores = data.map(item => item.average_score);  // Y-axis data (average scores)

                const ctx = document.getElementById('score-chart').getContext('2d');

                // Clear previous chart instance if it exists
                if (window.scoreChart) {
                    window.scoreChart.destroy();
                }

                // Create a new Chart.js instance
                window.scoreChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Average Score Development',
                            data: scores,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            fill: false,
                        }]
                    },
                    options: {
                        scales: {
                            x: {
                                title: { display: true, text: 'Date' }
                            },
                            y: {
                                beginAtZero: true,
                                title: { display: true, text: 'Average Score' }
                            }
                        }
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error("Error loading score trend data:", xhr.responseText);
            }
        });
    }
});
