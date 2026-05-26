// Shared Performance Measures mega-menu functionality
(function() {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    const pmTrigger = document.getElementById('pmTrigger');
    const pmMenu = document.getElementById('pmMenu');
    const pmMainList = document.getElementById('pmMainList');
    const pmSubList = document.getElementById('pmSubList');
    const pmSubSubList = document.getElementById('pmSubSubList');

    if (!pmTrigger || !pmMenu || !pmMainList || !pmSubList || !pmSubSubList) {
      return; // Menu elements not found on this page
    }

    // Hover intent timer IDs
    let mainHoverTimer = null;
    let subHoverTimer = null;
    let pmOpen = false;

    // Hierarchical data structure (shared across all tabs; matches traffic-analysis-summary.html)
    const PM_TREE = {
      baseline_weekday: {
        label: 'Baseline Weekday',
        children: {
          baseline_weekday_wc_trips: { label: 'WC Trips Flow Patterns', value: 'baseline_weekday_wc_trips' },
          baseline_weekday_bottlenecks: { label: 'Freeway-Bottlenecks', value: 'baseline_weekday_bottlenecks' },
          baseline_weekday_route_travel: { label: 'Route Travel Time', value: 'baseline_weekday_route_travel' },
          baseline_weekday_corridor: { label: 'Key-Arterials', value: 'baseline_weekday_corridor' },
          baseline_weekday_volume: { label: 'Baseline volume', value: 'baseline_weekday_volume' },
          baseline_weekday_congestion: { label: 'Baseline congestion', value: 'baseline_weekday_congestion' }
        }
      },
      baseline_weekend: {
        label: 'Baseline Weekend',
        children: {
          baseline_weekend_wc_trips: { label: 'WC Trips Flow Patterns', value: 'baseline_weekend_wc_trips' },
          baseline_weekend_bottlenecks: { label: 'Freeway-Bottlenecks', value: 'baseline_weekend_bottlenecks' },
          baseline_weekend_route_travel: { label: 'Route Travel Time', value: 'baseline_weekend_route_travel' },
          baseline_weekend_corridor: { label: 'Key-Arterials', value: 'baseline_weekend_corridor' },
          baseline_weekend_volume: { label: 'Baseline volume', value: 'baseline_weekend_volume' },
          baseline_weekend_congestion: { label: 'Baseline congestion', value: 'baseline_weekend_congestion' }
        }
      },
      incident_scenario: {
        label: 'Incident Scenario',
        children: {
          incident_location_1: { label: 'Incident Scenario 1', value: 'incident_scenario_1' },
          incident_location_2: { label: 'Incident Scenario 2', value: 'incident_scenario_2' },
          incident_location_3: { label: 'Incident Scenario 3', value: 'incident_scenario_3' }
        }
      },
      tdm_scenario: {
        label: 'TDM Scenario',
        value: 'tdm_scenario'
      },
      transit_scenario: {
        label: 'Transit Scenario',
        value: 'transit_scenario'
      }
    };

    function updateMenuWidth() {
      const subVisible = pmSubList.children.length > 0 && document.querySelector('.pm-column-sub.visible');
      const subSubVisible = pmSubSubList.children.length > 0 && document.querySelector('.pm-column-subsub.visible');
      
      if (subSubVisible) {
        pmMenu.style.minWidth = '720px';
      } else if (subVisible) {
        pmMenu.style.minWidth = '480px';
      } else {
        pmMenu.style.minWidth = '240px';
      }
    }

    function openMenu() {
      pmMenu.classList.add('open');
      pmTrigger.setAttribute('aria-expanded', 'true');
      pmOpen = true;
      renderMainColumn();
      document.querySelector('.pm-column-sub').classList.remove('visible');
      document.querySelector('.pm-column-subsub').classList.remove('visible');
      clearColumn(pmSubList);
      clearColumn(pmSubSubList);
      updateMenuWidth();
    }

    function closeMenu() {
      pmMenu.classList.remove('open');
      pmTrigger.setAttribute('aria-expanded', 'false');
      pmOpen = false;
      clearColumn(pmSubList);
      clearColumn(pmSubSubList);
      document.querySelector('.pm-column-sub').classList.remove('visible');
      document.querySelector('.pm-column-subsub').classList.remove('visible');
      updateMenuWidth();
    }

    function clearColumn(container) {
      while (container.firstChild) container.removeChild(container.firstChild);
    }

    function renderMainColumn(selectedKey) {
      clearColumn(pmMainList);
      Object.entries(PM_TREE).forEach(([key, node]) => {
        const hasChildren = node.children && Object.keys(node.children).length > 0;
        const item = document.createElement('div');
        item.className = 'pm-item' + (hasChildren ? ' has-children' : '');
        item.dataset.key = key;
        item.dataset.level = 'main';
        item.innerHTML = `<span class="pm-item-label">${node.label}</span>` + (hasChildren ? `<span class="pm-item-chevron">›</span>` : '');
        if (hasChildren) {
          item.addEventListener('mouseenter', () => handleMainHover(key));
          item.addEventListener('mouseleave', () => {
            if (mainHoverTimer) clearTimeout(mainHoverTimer);
          });
        }
        item.addEventListener('click', () => handleMainClick(key));
        pmMainList.appendChild(item);
      });
      if (selectedKey && PM_TREE[selectedKey]) {
        handleMainHover(selectedKey);
      }
    }

    function renderSubColumn(mainKey, selectedSubKey) {
      clearColumn(pmSubList);
      clearColumn(pmSubSubList);
      document.querySelector('.pm-column-subsub').classList.remove('visible');
      
      if (!mainKey || !PM_TREE[mainKey] || !PM_TREE[mainKey].children) {
        document.querySelector('.pm-column-sub').classList.remove('visible');
        updateMenuWidth();
        return;
      }

      const children = PM_TREE[mainKey].children;
      const subColumn = document.querySelector('.pm-column-sub');
      
      if (Object.keys(children).length === 0) {
        subColumn.classList.remove('visible');
        updateMenuWidth();
        return;
      }

      Object.entries(children).forEach(([key, node]) => {
        const hasChildren = node.children && Object.keys(node.children).length > 0;
        const item = document.createElement('div');
        item.className = 'pm-item' + (hasChildren ? ' has-children' : '');
        item.dataset.key = key;
        item.dataset.mainKey = mainKey;
        item.dataset.level = 'sub';
        item.innerHTML = `<span class="pm-item-label">${node.label}</span>` + (hasChildren ? `<span class="pm-item-chevron">›</span>` : '');
        if (hasChildren) {
          item.addEventListener('mouseenter', () => handleSubHover(mainKey, key));
          item.addEventListener('mouseleave', () => {
            if (subHoverTimer) clearTimeout(subHoverTimer);
          });
        }
        item.addEventListener('click', (e) => handleSubClick(e, mainKey, key));
        pmSubList.appendChild(item);
      });

      subColumn.classList.add('visible');
      updateMenuWidth();

      if (selectedSubKey && children[selectedSubKey]) {
        handleSubHover(mainKey, selectedSubKey);
      }
    }

    function renderSubSubColumn(mainKey, subKey) {
      clearColumn(pmSubSubList);
      const subNode = PM_TREE[mainKey]?.children?.[subKey];
      const subSubColumn = document.querySelector('.pm-column-subsub');
      
      if (!subNode || !subNode.children || Object.keys(subNode.children).length === 0) {
        subSubColumn.classList.remove('visible');
        updateMenuWidth();
        return;
      }

      Object.entries(subNode.children).forEach(([key, node]) => {
        const item = document.createElement('div');
        item.className = 'pm-item';
        item.dataset.key = key;
        item.dataset.mainKey = mainKey;
        item.dataset.subKey = subKey;
        item.dataset.level = 'subsub';
        item.innerHTML = `<span class="pm-item-label">${node.label}</span>`;
        item.addEventListener('click', () => handleLeafSelection(mainKey, subKey, key));
        pmSubSubList.appendChild(item);
      });

      subSubColumn.classList.add('visible');
      updateMenuWidth();
    }

    function handleMainHover(mainKey) {
      if (mainHoverTimer) clearTimeout(mainHoverTimer);
      mainHoverTimer = setTimeout(() => {
        const node = PM_TREE[mainKey];
        if (node && node.children && Object.keys(node.children).length > 0) {
          renderSubColumn(mainKey);
        }
      }, 150);
    }

    function handleMainClick(mainKey) {
      const node = PM_TREE[mainKey];
      if (node && node.children && Object.keys(node.children).length > 0) {
        renderSubColumn(mainKey);
        return;
      }
      // Allow main-level leaf nodes (like TDM Scenario)
      if (node && node.value) {
        handleLeafSelection(mainKey, null, null);
      }
    }

    function handleSubHover(mainKey, subKey) {
      if (subHoverTimer) clearTimeout(subHoverTimer);
      subHoverTimer = setTimeout(() => {
        const node = PM_TREE[mainKey]?.children?.[subKey];
        if (node && node.children && Object.keys(node.children).length > 0) {
          renderSubSubColumn(mainKey, subKey);
        } else {
          clearColumn(pmSubSubList);
          document.querySelector('.pm-column-subsub').classList.remove('visible');
          updateMenuWidth();
        }
      }, 150);
    }

    function handleSubClick(event, mainKey, subKey) {
      const node = PM_TREE[mainKey]?.children?.[subKey];
      if (node && node.children && Object.keys(node.children).length > 0) {
        renderSubSubColumn(mainKey, subKey);
        event.stopPropagation();
        return;
      }
      handleLeafSelection(mainKey, subKey, null);
    }

    function handleLeafSelection(mainKey, subKey, subSubKey) {
      const mainNode = PM_TREE[mainKey];
      const subNode = subKey ? mainNode.children[subKey] : null;
      const leafNode = subSubKey
        ? mainNode.children[subKey].children[subSubKey]
        : (subNode || mainNode);

      if (!leafNode || !leafNode.value) return;

      // Navigate to Performance Measures page with the selected value
      window.location.href = `traffic-analysis-summary.html?pm=${encodeURIComponent(leafNode.value)}`;
    }

    pmTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (pmOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('click', (e) => {
      if (!pmOpen) return;
      if (!pmMenu.contains(e.target) && e.target !== pmTrigger && !pmTrigger.contains(e.target)) {
        closeMenu();
      }
    });

    pmMenu.addEventListener('mouseleave', () => {
      if (mainHoverTimer) clearTimeout(mainHoverTimer);
      if (subHoverTimer) clearTimeout(subHoverTimer);
    });

    document.addEventListener('keydown', (e) => {
      if (!pmOpen) return;
      if (e.key === 'Escape') {
        closeMenu();
        pmTrigger.focus();
      }
    });

    // Close the Performance Measures menu when navigating via header tabs (e.g., Supply Inputs)
    document.querySelectorAll('.tabs .tab a').forEach(link => {
      link.addEventListener('click', () => {
        if (pmOpen) {
          closeMenu();
        }
      });
    });

    // Initial render
    renderMainColumn();
  }

  // (No extra ready hook needed; handled above)
})();
